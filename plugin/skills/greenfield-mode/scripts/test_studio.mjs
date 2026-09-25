#!/usr/bin/env node
// End-to-end test of the studio engine. Builds a throwaway project in a temp
// folder, starts the real server, and drives the page in Chromium.
//   node <greenfield-mode>/scripts/test_studio.mjs [--keep] [--shots <folder>]
import { spawn } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { loadPlaywright } from "./playwright.mjs"

const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const keep = process.argv.includes("--keep")
const shotsIndex = process.argv.indexOf("--shots")
const shots = shotsIndex > 0 ? resolve(process.argv[shotsIndex + 1]) : null
const results = []
const check = (name, pass, detail = "") => { results.push({ name, pass, detail }); console.log(`${pass ? "✓" : "✗"} ${name}${detail ? `  (${detail})` : ""}`) }

const root = await mkdtemp(join(tmpdir(), "studio-test-"))
const studio = join(root, "studio")
await mkdir(join(root, ".agents/skills/greenfield-mode/assets"), { recursive: true })
await symlink(join(skill, "assets/studio-engine"), join(root, ".agents/skills/greenfield-mode/assets/studio-engine"))
await cp(join(skill, "assets/studio-content"), studio, { recursive: true })
await mkdir(join(studio, "candidates"))

// D1: an empty studio says what to add.
let server = await startServer()
const empty = await fetch(`${server.url}api/project`).then((response) => response.json())
check("D1 empty studio asks for screens and variants", empty._problems.some((problem) => problem.includes("Add one screen")) && empty._problems.some((problem) => problem.includes("Add one variant per model")), empty._problems.join("; "))
check("the engine fixes three sizes: 1920×1080, 1440×900, 390×844", empty._sizes.map((size) => `${size.width}x${size.height}`).join(" ") === "1920x1080 1440x900 390x844")
server.process.kill()

// Two models' variants, each in its own folder. Model B's returns screen isn't built yet.
await writeFile(join(studio, "project.json"), JSON.stringify(fixtureProject(), null, 2))
for (const [id, variant] of Object.entries(fixtureVariants())) {
  await mkdir(join(studio, `candidates/${id}`))
  await writeFile(join(studio, `candidates/${id}/variant.json`), JSON.stringify(variant, null, 2))
}
for (const [id, screen] of [["paper", "orders"], ["paper", "returns"], ["clash", "orders"]]) await writeFile(join(studio, `candidates/${id}/${screen}.html`), fixturePage(screen))
server = await startServer()
const api = (path, body) => fetch(server.url + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

const unbuilt = await fetch(`${server.url}api/project`).then((response) => response.json())
check("variants are found by their folders, each named by its model", unbuilt.variants.map((item) => `${item.id}:${item.model}`).join(" ") === "paper:Model A clash:Model B", JSON.stringify(unbuilt.variants.map((item) => item.id)))
check("a screen without a file is listed as a problem", unbuilt._problems.some((problem) => problem.includes("Variant 'clash' has no file yet for: returns")) && unbuilt._missing.clash?.includes("returns"), unbuilt._problems.join("; "))
for (const id of ["c", "d"]) {
  await mkdir(join(studio, `candidates/${id}`))
  await writeFile(join(studio, `candidates/${id}/variant.json`), JSON.stringify(fixtureVariants().paper))
}
const tooMany = await fetch(`${server.url}api/project`).then((response) => response.json())
check("a fourth variant is a problem: one per model, three at most", tooMany._problems.some((problem) => problem.includes("at most 3 variants")), tooMany._problems.join("; "))
for (const id of ["c", "d"]) await rm(join(studio, `candidates/${id}`), { recursive: true })
await writeFile(join(studio, "candidates/clash/returns.html"), fixturePage("returns"))
const built = await fetch(`${server.url}api/project`).then((response) => response.json())
check("once every file exists the studio has no problems", built._problems.length === 0 && Object.keys(built._missing).length === 0, built._problems.join("; "))
const variantCheck = await run("python3", [join(skill, "scripts/check_variant.py"), studio, "--variant", "clash"])
check("check_variant.py reports the failing look of one variant", variantCheck.code === 1 && variantCheck.out.includes("color-primary stays clear of the danger red"), variantCheck.out.trim().split("\n").at(-1))

// Server refusals.
check("server refuses a client-set approval", (await api("api/selection", { status: "approved" })).status === 400)
check("server refuses an unknown variant", (await api("api/selection", { variant: "nope" })).status === 400)
check("server refuses a size outside the three", (await api("api/selection", { width: 1024 })).status === 400)
check("server refuses tuning a radius", (await api("api/selection", { tuning: { paper: { "radius-sm": "oklch(0.5 0 0)" } } })).status === 400)
check("server refuses approval from a stale page", (await api("api/approve", { revision: 999 })).status === 409)
check("server refuses a POST from another origin", (await fetch(server.url + "api/selection", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://evil.example" }, body: "{}" })).status === 409)
check("server refuses a POST that isn't JSON", (await fetch(server.url + "api/selection", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "{}" })).status === 400)
const seeded = JSON.parse(await readFile(join(studio, "selection.json"), "utf8"))
await writeFile(join(studio, "selection.json"), JSON.stringify({ ...seeded, tuning: { ghost: { "color-bg": "#ffffff" }, paper: { "color-gone": "#000000" } } }))
const afterStale = await api("api/selection", { screen: "orders" })
const staleBody = await afterStale.json()
check("saved tuning for a removed variant or token doesn't block saving", afterStale.status === 200 && !staleBody.tuning.ghost && !staleBody.tuning.paper?.["color-gone"], JSON.stringify(staleBody.tuning))

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
await page.goto(server.url)
await page.waitForSelector("#board .board-item")

// A model's tab: its screens in a boxed row per size, each frame at its exact size.
const tabs = (await page.locator("#model-tabs button").allInnerTexts()).map((text) => text.replace(/\s+/g, " ").trim())
check("one tab per model, then Arena", tabs.join("|") === "Model A Paper|Model B Clash|Arena all 2 models", tabs.join("|"))
const rail = await page.locator(".screen-item").allInnerTexts()
check("the rail lists the screens by number, then the design system page", rail.map((text) => text.replace(/\s+/g, " ").trim()).join("|") === "1 Orders|2 Returns|Fonts and colors", rail.join("|"))
const model = await page.evaluate(() => ({
  groups: [...document.querySelectorAll("#board .board-group-label")].map((item) => item.textContent),
  items: [...document.querySelectorAll("#board .board-item")].map((item) => `${item.dataset.variant}/${item.dataset.screen}@${item.offsetWidth}x${item.querySelector(".board-frame").offsetHeight}`),
}))
check("a model's canvas has a box per size, labelled with its dimensions", model.groups.join("|") === "Desktop1920 × 1080|Laptop1440 × 900|Phone390 × 844", model.groups.join("|"))
check("every screen shows at each exact size", model.items.join(" ") === "paper/orders@1920x1080 paper/returns@1920x1080 paper/orders@1440x900 paper/returns@1440x900 paper/orders@390x844 paper/returns@390x844", model.items.join(" "))
const zoomBefore = await page.textContent("#zoom-level")
await page.click("#zoom-in")
check("zoom in changes the canvas zoom", (await page.textContent("#zoom-level")) !== zoomBefore)

// Arena: a row per model, the three size boxes side by side.
await page.click("[data-model-tab='']")
const arena = await page.evaluate(() => ({ rows: [...document.querySelectorAll("#board .board-row-label strong")].map((item) => item.textContent), groups: document.querySelectorAll("#board .board-group").length, items: document.querySelectorAll("#board .board-item").length }))
check("Arena shows a row per model with three size boxes each", arena.rows.join("|") === "Model A|Model B" && arena.groups === 6 && arena.items === 12, JSON.stringify(arena))

// A screen from the rail: that screen from every model, models across, sizes down.
await page.click(".screen-item[data-screen='returns']")
const compare = await page.evaluate(() => ({
  title: document.querySelector("#board .board-title strong")?.textContent,
  labels: [...document.querySelectorAll("#board .board-group:first-of-type .board-label strong")].map((item) => item.textContent),
  groups: document.querySelectorAll("#board .board-group").length,
}))
check("a screen from the rail shows it from every model, named by model, at three sizes", compare.title === "Returns" && compare.labels.join("|") === "Model A|Model B" && compare.groups === 3, JSON.stringify(compare))
await page.locator("#board .board-group:nth-of-type(2) .board-item[data-variant='clash'] .board-frame").click()
check("clicking a frame selects that model's screen", await page.locator("#board .board-item[data-variant='clash'][aria-current=true]").count() > 0)
await page.locator("#board .board-item[data-variant='clash'][data-width='1440'] .board-frame").dblclick()
const opened = await page.evaluate(() => ({ stage: !document.querySelector("#stage").hidden, title: document.querySelector("#preview-title").textContent, need: document.querySelector("#preview-need").textContent }))
check("double-clicking a frame opens that screen alone at that size", opened.stage && opened.title === "Returns by Model B, Laptop 1440 × 900", opened.title)
check("the single screen names the requirement it answers", opened.need === "Staff · Staff see returned parcels.", opened.need)
await page.click("button[data-width='390']")
const phone = await page.evaluate(() => { const frame = document.querySelector("#frame-holder iframe"); return `${frame.offsetWidth}x${frame.offsetHeight}` })
check("the phone size is exactly 390 × 844", phone === "390x844", phone)
await page.click("#frame-back")
check("Back returns to the screen comparison", await page.locator("#board .board-title strong").textContent() === "Returns" && await page.locator("#stage").isHidden())
const linked = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await linked.goto(`${server.url}?view=arena`)
await linked.waitForSelector("#board .board-row-label")
check("?view=arena opens Arena", (await linked.locator("#board .board-row").count()) === 2)
await linked.close()

// One screen alone: fonts, fit and real size.
await page.click("[data-model-tab='paper']")
await page.locator("#board .board-item[data-screen='orders'][data-width='1920'] .board-frame").dblclick()
const preview = page.frameLocator("#frame-holder iframe")
const previewFrame = async () => (await page.locator("#frame-holder iframe").elementHandle()).contentFrame()
await preview.locator("html[data-studio-ready=true]").waitFor()
const fonts = await (await previewFrame())?.evaluate(() => [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family.replace(/"/g, "")))
check("D2 the screen loads its model's Google Fonts", fonts?.includes("Unbounded") && fonts?.includes("Onest"), fonts?.join(", "))
const fitted = await page.evaluate(() => ({ holder: document.querySelector("#frame-holder").getBoundingClientRect(), stage: document.querySelector("#canvas").getBoundingClientRect(), frame: document.querySelector("#frame-holder iframe").offsetWidth }))
check("Fit shows the whole 1920 × 1080 screen inside the canvas", fitted.frame === 1920 && fitted.holder.width <= fitted.stage.width && fitted.holder.height <= fitted.stage.height, `${Math.round(fitted.holder.width)}x${Math.round(fitted.holder.height)} in ${Math.round(fitted.stage.width)}x${Math.round(fitted.stage.height)}`)
await page.click("#zoom-toggle")
const real = await page.locator("#frame-holder").evaluate((element) => element.getBoundingClientRect().width)
check("100% shows the screen at real pixel size", Math.round(real) === 1920, `${real}px`)
await page.click("#zoom-toggle")

// A failing look: hue clash and a font without Cyrillic.
await page.click("[data-model-tab='clash']")
await page.click("[data-tab='checks']")
await page.waitForFunction(() => !document.querySelector("#checks").textContent.includes("Checking fonts"))
const clashState = await page.evaluate(() => ({ disabled: document.querySelector("#approve").disabled, checks: document.querySelector("#checks").innerText }))
check("hue guard fails a red primary", /primary stays clear of the danger red/.test(clashState.checks) && clashState.disabled)
check("font check fails a family without Cyrillic", /Syne: missing cyrillic/.test(clashState.checks), clashState.checks.split("\n").find((line) => line.includes("Syne")))

// D3: tune until contrast fails, then reset.
await page.click("[data-model-tab='paper']")
await page.waitForFunction(() => !document.querySelector("#approve").disabled)
check("a passing model's design can be approved", (await page.textContent("#approve")).includes("Approve Model A"), await page.textContent("#approve"))
await page.locator("#board .board-item[data-screen='orders'][data-width='1920'] .board-frame").dblclick()
await preview.locator("html[data-studio-ready=true]").waitFor()
await page.click("[data-tab='tune']")
await page.click("details[data-token='color-on-primary'] summary")
await page.locator("details[data-token='color-on-primary'] input[data-channel='L']").evaluate((input) => { input.value = "0.5"; input.dispatchEvent(new Event("input", { bubbles: true })) })
const tuned = await page.evaluate(() => ({ disabled: document.querySelector("#approve").disabled, failing: [...document.querySelectorAll("#checks li[data-state=fail]")].map((item) => item.innerText) }))
check("D3 low contrast blocks approval", tuned.disabled && tuned.failing.some((line) => line.includes("Text on primary buttons")), tuned.failing.join(" | "))
await page.waitForTimeout(300)
const liveValue = await (await previewFrame())?.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-on-primary").trim())
check("D3 tuning reaches the screen live", liveValue?.startsWith("oklch(0.500"), liveValue)
check("D3 status colors have no controls", await page.locator("#tuner input").evaluateAll((inputs) => inputs.every((input) => !input.closest("details").dataset.token.startsWith("status"))) && (await page.locator("#tuner .token.locked").count()) === 3)
await page.waitForFunction(() => document.querySelector("#save-status").textContent.startsWith("Saved"))
await page.reload()
await page.frameLocator("#frame-holder iframe").locator("html[data-studio-ready=true]").waitFor()
check("a reload reopens the view you last used", await page.locator("#stage").isVisible())
await page.click("[data-tab='tune']")
await page.click("#reset-tuning")
await page.waitForFunction(() => !document.querySelector("#approve").disabled)
check("D3 reset restores a passing look", true)
await page.waitForTimeout(300)
const afterReset = await (await previewFrame())?.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-on-primary").trim())
check("reset after a reload also resets the screen", afterReset === "oklch(0.99 0 0)", afterReset)

// D4: pin a comment, reload, see the pin on the same element.
await page.waitForTimeout(500)
await page.click("#comment-toggle")
await preview.locator("[data-order='1002'] strong").click()
await page.waitForSelector("#comment-form:not([hidden])")
await page.click("label:has(input[name=kind][value=reject])")
await page.fill("#comment-text", "Too much space between orders")
await page.click("#comment-form button[type=submit]")
await page.waitForSelector("#comment-form", { state: "hidden" })
const stored = JSON.parse(await readFile(join(studio, "comments.json"), "utf8"))
check("D4 comment saved with its model, screen, size and selector", stored.length === 1 && stored[0].selector.includes("1002") && stored[0].kind === "reject" && stored[0].variant === "paper" && stored[0].width === 1920, JSON.stringify(stored[0]))
const taste = await readFile(join(studio, "taste.md"), "utf8")
check("D4 reject is logged in taste.md", taste.includes("reject · paper") && taste.includes("Too much space"))
await page.reload()
await page.frameLocator("#frame-holder iframe").locator(".__studio-pin").waitFor()
const pinPlacement = await (await previewFrame())?.evaluate(() => {
  const pin = document.querySelector(".__studio-pin").getBoundingClientRect()
  const target = document.querySelector("[data-order='1002'] strong").getBoundingClientRect()
  return { dx: Math.abs(pin.left - target.right), dy: Math.abs(pin.top - target.top) }
})
check("D4 pin returns to the same element after reload", pinPlacement && pinPlacement.dx < 30 && pinPlacement.dy < 30, JSON.stringify(pinPlacement))

// Comments work on the canvas too, saved against the frame that was clicked.
await page.click("#frame-back")
await page.click("#zoom-fit")
await page.frameLocator("#board iframe[data-variant='paper'][data-screen='returns'][data-width='390']").locator("html[data-studio-ready=true]").waitFor()
await page.click("#comment-toggle")
await page.frameLocator("#board iframe[data-variant='paper'][data-screen='returns'][data-width='390']").locator("[data-order='1003'] strong").click()
await page.waitForSelector("#comment-form:not([hidden])")
await page.fill("#comment-text", "Returns need a date column")
await page.click("#comment-form button[type=submit]")
await page.waitForSelector("#comment-form", { state: "hidden" })
const onCanvas = JSON.parse(await readFile(join(studio, "comments.json"), "utf8")).at(-1)
check("a comment pinned on the canvas is saved for that model, screen and size", onCanvas?.variant === "paper" && onCanvas?.screen === "returns" && onCanvas?.width === 390 && onCanvas?.selector.includes("1003"), JSON.stringify(onCanvas))
await page.frameLocator("#board iframe[data-variant='paper'][data-screen='returns'][data-width='390']").locator(".__studio-pin").waitFor()
check("the canvas frame shows the new pin", true)

// Palettes: library, apply, browse with keys, shortlist, filters, generate, save.
const palettes = await fetch(server.url + "api/palettes").then((response) => response.json())
check("palette library ships at least 40 palettes", palettes.library.length >= 40, `${palettes.library.length}`)
const tokenApi = await fetch(server.url + "api/tokens?world=paper").then((response) => response.json())
check("tokens API derives the palette tokens a look lacks", Boolean(tokenApi.tokens["color-secondary"] && tokenApi.tokens["color-tertiary-soft"] && tokenApi.tokens["status-danger"]))
await page.locator("#board .board-item[data-screen='orders'][data-width='1920'] .board-frame").dblclick()
await preview.locator("html[data-studio-ready=true]").waitFor()
await page.click("[data-tab='colors']")
check("the Colors tab names the model's own colors and lists every model's originals", (await page.textContent("#palette-name")) === "Model A's colors" && (await page.locator("#original-list .original-row").count()) === 2)
// Change both models' colors, then restore one: only that model goes back.
await page.click("[data-apply='deep-sea']")
check("picking a palette enables that model's Restore at once", await page.locator("[data-restore='paper']").isEnabled() && (await page.textContent("[data-original='paper'] .tags")) === "Now: Deep Sea" && await page.locator("#restore-all").isEnabled())
await page.click("[data-model-tab='clash']")
await page.click("[data-apply='ochre']")
await page.waitForFunction(() => document.querySelector("#save-status").textContent === "Saved")
await page.click("[data-restore='paper']")
await page.waitForFunction(() => document.querySelector("#save-status").textContent === "Saved")
const one = JSON.parse(await readFile(join(studio, "selection.json"), "utf8"))
check("Restore on one model resets only that model", !one.tuning.paper && !one.palette.paper && one.palette.clash?.id === "ochre", JSON.stringify(Object.keys(one.palette)))
await page.click("[data-apply='deep-sea']")
await page.waitForFunction(() => document.querySelector("#save-status").textContent === "Saved")
await page.click("#restore-all")
await page.waitForFunction(() => document.querySelector("#save-status").textContent === "Saved")
const all = JSON.parse(await readFile(join(studio, "selection.json"), "utf8"))
const variantFile = JSON.parse(await readFile(join(studio, "candidates/paper/variant.json"), "utf8"))
check("Restore all puts every model back to its original colors; variant.json never changes", !Object.keys(all.tuning).length && !Object.keys(all.palette).length && variantFile.world.tokens["color-primary"] === "oklch(0.45 0.12 250)" && await page.locator("#restore-all").isDisabled())
await page.click("[data-model-tab='paper']")
await page.locator("#board .board-item[data-screen='orders'][data-width='1920'] .board-frame").dblclick()
await preview.locator("html[data-studio-ready=true]").waitFor()
await page.click("[data-apply='ochre']")
await page.waitForFunction(() => document.querySelector("#palette-name").textContent === "Ochre")
await page.waitForFunction(() => document.querySelector("#save-status").textContent === "Saved")
const stored2 = JSON.parse(await readFile(join(studio, "selection.json"), "utf8"))
const livePrimary = await (await previewFrame())?.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim())
check("applying a palette recolors the screen and is saved", stored2.palette.paper?.id === "ochre" && livePrimary === stored2.tuning.paper["color-primary"], `${livePrimary}`)
await page.keyboard.press("ArrowRight")
await page.waitForFunction(() => document.querySelector("#palette-name").textContent !== "Ochre")
const stepped = await page.textContent("#palette-name")
check("the right arrow applies the next palette", stepped === palettes.library[1].name, stepped)
await page.keyboard.press("s")
await page.waitForTimeout(500)
await page.click("[data-filter='shortlist']")
check("S stars the palette into the shortlist", (await page.locator("#palette-list .palette-row").count()) === 1)
await page.click("[data-filter='shortlist']")
await page.check("#hide-failing")
const passing = await page.locator("#palette-list .palette-row").count()
check("hiding failing palettes filters the list", passing > 0 && passing < palettes.library.length, `${passing} of ${palettes.library.length}`)
await page.uncheck("#hide-failing")
await page.fill("#seed-text", "#8a2f5d")
check("one color generates five palettes", (await page.locator("#generated-list .palette-row").count()) === 5)
await page.click("#palette-save")
await page.fill("#save-name", "Test palette")
await page.click("#save-form button[type=submit]")
await page.waitForFunction(() => document.querySelector("#palette-name").textContent === "Test palette")
const custom = JSON.parse(await readFile(join(studio, "palettes.json"), "utf8"))
check("a palette saves to the project library", custom.length === 1 && custom[0].name === "Test palette")
const ochreFit = await page.locator("[data-palette='ochre'] .fit").getAttribute("data-state")
check("a palette too close to the warning amber is flagged", ochreFit === "fail", ochreFit)
await page.click("[data-apply='deep-sea']")
await page.waitForFunction(() => document.querySelector("#palette-name").textContent === "Deep Sea")

// D5: approve writes both files; a later tune makes them outdated.
await page.waitForFunction(() => !document.querySelector("#approve").disabled)
const current = JSON.parse(await readFile(join(studio, "selection.json"), "utf8"))
check("server refuses approval when fonts miss a script", (await api("api/approve", { revision: current.revision, fontChecks: { Unbounded: "missing cyrillic" } })).status === 409)
await page.click("#approve")
await page.waitForFunction(() => document.querySelector("#approve").textContent.includes("approved"))
const design = await readFile(join(root, "DESIGN.md"), "utf8").catch(() => "")
const tokensCss = await readFile(join(root, "design/tokens.css"), "utf8").catch(() => "")
check("D5 approval writes DESIGN.md in the spec shape", design.startsWith("---\nname: \"Fixture Shop\"") && design.includes("## Colors") && design.includes("## Do's and Don'ts") && /primary: "#[0-9a-f]{6}"/.test(design))
check("D5 DESIGN.md names the model and lists its screens", design.includes("Designed by Model A") && design.includes("`studio/candidates/paper/returns.html`"))
check("D5 approval writes tokens.css with fonts and status colors", tokensCss.includes("--color-primary: oklch(") && tokensCss.includes("--status-danger") && tokensCss.includes("fonts.googleapis.com"))
check("D5 DESIGN.md records the Cyrillic check", design.includes("Unbounded: covers cyrillic"))
check("D5 DESIGN.md and tokens.css carry the palette and its tonal scales", design.includes("Palette: Deep Sea") && design.includes("Tonal scales") && tokensCss.includes("--primary-50:"))
await page.click("[data-tab='tune']")
await page.click("details[data-token='color-accent'] summary")
await page.locator("details[data-token='color-accent'] input[data-channel='H']").evaluate((input) => { input.value = "160"; input.dispatchEvent(new Event("input", { bubbles: true })) })
await page.waitForFunction(() => document.querySelector("#export-label").dataset.outdated === "true")
const selection = JSON.parse(await readFile(join(studio, "selection.json"), "utf8"))
check("D5 a later tune returns to draft and marks the export outdated", selection.status === "draft" && selection.exported.revision < selection.revision, `rev ${selection.revision}, exported ${selection.exported.revision}`)
await writeFile(join(root, "DESIGN.md"), "# Hand-written design notes\n")
await page.waitForFunction(() => !document.querySelector("#approve").disabled)
const refusal = await api("api/approve", { revision: selection.revision })
check("approval refuses to overwrite a hand-written DESIGN.md", refusal.status === 409 && (await readFile(join(root, "DESIGN.md"), "utf8")).startsWith("# Hand-written"))

// Specimen: every model's look side by side, and one alone.
await page.click(".screen-item[data-screen='specimen']")
check("the specimen shows each model's look side by side", (await page.locator("#board .board-item").count()) === 2)
await page.locator("#board .board-item[data-variant='paper'] .board-frame").dblclick()
await page.frameLocator("#frame-holder iframe").locator(".role").first().waitFor()
const specimenRoles = await page.frameLocator("#frame-holder iframe").locator(".role").count()
const specimenTones = await page.frameLocator("#frame-holder iframe").locator(".role .tones span").count()
check("a specimen shows four roles and their tonal scales", specimenRoles === 4 && specimenTones === 44, `${specimenRoles} roles, ${specimenTones} tones`)
await page.click("#frame-back")
if (shots) { await mkdir(shots, { recursive: true }); await page.screenshot({ path: join(shots, "test-studio-1440.png"), fullPage: false }) }
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(300)
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
check("studio page has no sideways scroll at 390px", overflow <= 1, `${overflow}px`)
if (shots) await page.screenshot({ path: join(shots, "test-studio-390.png"), fullPage: false })

const realErrors = errors.filter((message) => !message.includes("favicon"))
check("no console or page errors", realErrors.length === 0, realErrors.slice(0, 3).join(" | "))

await browser.close()
server.process.kill()
if (!keep) await rm(root, { recursive: true, force: true })
else console.log(`Kept fixture at ${root}`)
const failed = results.filter((result) => !result.pass).length
console.log(`\n${results.length - failed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)

function startServer() {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("python3", [join(studio, "server.py"), "--port", "0"], { cwd: root })
    const timer = setTimeout(() => reject(new Error("server did not start")), 8000)
    child.stdout.on("data", (chunk) => {
      const match = /http:\/\/127\.0\.0\.1:\d+\//.exec(String(chunk))
      if (match) { clearTimeout(timer); resolvePromise({ process: child, url: match[0] }) }
    })
    child.stderr.on("data", (chunk) => process.stderr.write(chunk))
  })
}

function run(command, args) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args)
    let out = ""
    child.stdout.on("data", (chunk) => { out += chunk })
    child.stderr.on("data", (chunk) => { out += chunk })
    child.on("close", (code) => resolvePromise({ code, out }))
  })
}

function fixtureProject() {
  return {
    name: "Fixture Shop", language: "bg", scripts: ["cyrillic"],
    screens: [{ id: "orders", label: "Orders" }, { id: "returns", label: "Returns", role: "Staff", requirement: "Staff see returned parcels." }],
    status: { danger: "oklch(0.52 0.19 27)", warning: "oklch(0.52 0.12 70)", ok: "oklch(0.5 0.12 150)" },
    statusMeaning: { danger: "Payment failed", warning: "Late", ok: "Delivered" },
    references: [],
  }
}

function fixtureVariants() {
  const base = { "color-bg": "oklch(0.97 0.01 85)", "color-surface": "oklch(0.995 0.005 85)", "color-ink": "oklch(0.25 0.02 260)", "color-muted": "oklch(0.47 0.02 260)", "color-line": "oklch(0.88 0.01 85)", "color-primary": "oklch(0.45 0.12 250)", "color-on-primary": "oklch(0.99 0 0)", "color-accent": "oklch(0.55 0.13 150)", "radius-sm": "3px", "radius-md": "6px" }
  return {
    paper: { model: "Model A", summary: "Warm paper and ink.", order: 1, world: { name: "Paper", summary: "Warm paper and ink.", signature: "Ledger rules", fonts: { display: "\"Unbounded\", sans-serif", body: "\"Onest\", sans-serif", google: "family=Unbounded:wght@700&family=Onest:wght@400;600" }, tokens: base } },
    clash: { model: "Model B", summary: "Fails on purpose.", order: 2, world: { name: "Clash", fonts: { display: "\"Syne\", sans-serif", body: "\"Onest\", sans-serif", google: "family=Syne:wght@700&family=Onest:wght@400" }, tokens: { ...base, "color-primary": "oklch(0.5 0.2 20)" } } },
  }
}

function fixturePage(screen) {
  const order = (id, name, note) => `<article class="order" data-order="${id}"><strong>№${id} · ${name}</strong><p>${note}</p><button type="button">Отвори</button></article>`
  return `<!doctype html><html lang="bg"><head><meta charset="utf-8"><title>${screen}</title><script src="/_studio/frame.js"></script>
<style>body{margin:0;background:var(--color-bg);color:var(--color-ink);font:15px/1.5 var(--font-body)}main{max-width:1000px;margin:0 auto;padding:32px}
h1{font:700 32px/1.1 var(--font-display)}.orders{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
.order{background:var(--color-surface);border:1px solid var(--color-line);border-radius:var(--radius-md);padding:16px}
button{background:var(--color-primary);color:var(--color-on-primary);border:0;border-radius:var(--radius-sm);padding:10px 14px}</style></head>
<body><main><h1>${screen === "returns" ? "Върнати пратки" : "Поръчки за днес"}</h1><div class="orders">${order(1001, "Иванова", "Плащането не мина")}${order(1002, "Петров", "Доставена")}${order(1003, "Георгиева", "Закъснява")}</div></main></body></html>`
}
