#!/usr/bin/env node
// Export the approved design as a pack the builders read, not code they paste:
// for every screen, the rendered HTML with its CSS, and a PNG at 1440 and 390,
// light and dark. Written to <project>/design/screens/. With --check, each PNG
// is compared with the studio's own page and the result goes in README.md.
//
//   node <design-interface>/scripts/export_pack.mjs --url http://127.0.0.1:4173 --project <root> [--variant <id>] [--check] [--threshold 1]
//
// The studio must be running and the design approved (studio/selection.json).
// Playwright is found by ./playwright.mjs.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { loadPlaywright } from "./playwright.mjs"

const args = Object.fromEntries(process.argv.slice(2).map((arg, i, all) => (arg.startsWith("--") ? [arg.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]] : [])).filter((pair) => pair.length))
if (!args.url || !args.project) {
  console.error("Usage: export_pack.mjs --url <studio url> --project <root> [--variant <id>] [--check] [--threshold 1]")
  process.exit(2)
}
const studioUrl = String(args.url).replace(/\/$/, "")
const root = resolve(String(args.project))
const threshold = Number(args.threshold ?? 1)
const selectionFile = join(root, "studio", "selection.json")
if (!existsSync(selectionFile)) { console.error(`No ${selectionFile}: pass the project root that holds studio/`); process.exit(2) }
const selection = JSON.parse(await readFile(selectionFile, "utf8"))
const variant = args.variant && args.variant !== true ? String(args.variant) : selection.variant
if (!variant) { console.error("No variant: approve one in the studio or pass --variant"); process.exit(2) }
if (!args.variant && selection.status !== "approved") { console.error(`'${variant}' is not approved in the studio yet`); process.exit(2) }
for (const name of ["DESIGN.md", "design/tokens.css", "design/fonts.css", "design/shadcn.css"]) {
  if (!existsSync(join(root, name))) { console.error(`Missing ${name}: approve the design in the studio first`); process.exit(2) }
}
const project = await fetch(`${studioUrl}/api/project`).then((response) => response.json()).catch(() => {
  console.error(`The studio does not answer at ${studioUrl}. Start it from the project root: python3 studio/server.py`)
  process.exit(2)
})
const screens = project.screens.map((screen) => screen.id)
const out = join(root, "design", "screens")
await mkdir(out, { recursive: true })
const sizes = [{ width: 1440, height: 900 }, { width: 390, height: 844 }]

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
const rows = []
let failed = 0
try {
  // 1. The rendered HTML of each screen, plus one app.css with every stylesheet the page used.
  let appCss = null
  for (const screen of screens) {
    const page = await browser.newPage({ viewport: sizes[0], deviceScaleFactor: 1 })
    await page.goto(`${studioUrl}/candidates/${variant}/${screen}.html?world=${variant}`)
    await page.locator("html[data-studio-ready=true]").waitFor()
    await settle(page)
    const { html, sheets, title } = await page.evaluate(() => {
      const clone = document.documentElement.cloneNode(true)
      // Drop the studio's live theme and frame marks: the pack links the approved design files instead.
      clone.querySelectorAll("script, link[rel=stylesheet], style#studio-tokens").forEach((node) => node.remove())
      for (const name of ["data-studio-ready", "data-studio-world", "data-theme", "style"]) clone.removeAttribute(name)
      return { html: clone.outerHTML, sheets: [...document.querySelectorAll("link[rel=stylesheet]")].map((link) => link.href), title: document.title }
    })
    if (appCss === null) {
      const texts = await Promise.all(sheets.map(async (href) => `/* ${href} */\n${await (await fetch(href)).text()}`))
      appCss = texts.join("\n\n")
      await writeFile(join(out, "app.css"), appCss)
    }
    // The approved files come last, so their tokens win over the studio's live theme.
    const head = `<link rel="stylesheet" href="./app.css">\n<link rel="stylesheet" href="../fonts.css">\n<link rel="stylesheet" href="../tokens.css">\n<link rel="stylesheet" href="../shadcn.css">\n</head>`
    const doc = `<!doctype html>\n<!-- Approved screen "${screen}" from the design studio, variant ${variant}. A reference for building the real screen: structure, copy and look. Not app code. Dark: add class "dark" to <html>. -->\n${html.replace("</head>", head)}\n`
    await writeFile(join(out, `${screen}.html`), doc)
    await page.close()
    console.log(`✓ ${screen}.html${title ? ` (${title})` : ""}`)
  }

  // 2. PNGs from the pack itself, so they prove the pack is self-contained; with --check, against the studio.
  for (const screen of screens) {
    for (const size of sizes) {
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
        await page.goto(pathToFileURL(join(out, `${screen}.html`)).href)
        if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"))
        await settle(page)
        const shot = join(out, `${screen}__${size.width}__${theme}.png`)
        await page.screenshot({ path: shot, fullPage: true })
        let note = ""
        if (args.check) {
          await page.goto(`${studioUrl}/candidates/${variant}/${screen}.html?world=${variant}${theme === "dark" ? "&theme=dark" : ""}`)
          await page.locator("html[data-studio-ready=true]").waitFor()
          await settle(page)
          const studioShot = join(root, "temp", "verification", "design-pack", `${screen}__${size.width}__${theme}__studio.png`)
          await mkdir(join(root, "temp", "verification", "design-pack"), { recursive: true })
          await page.screenshot({ path: studioShot, fullPage: true })
          const diff = await compare(page, shot, studioShot)
          const ok = diff.percent <= threshold && diff.sameSize
          if (!ok) failed++
          note = `${diff.percent.toFixed(2)}% differ from the studio${diff.sameSize ? "" : ` (size ${diff.a} vs ${diff.b})`} · ${ok ? "ok" : "DIFFERS"}`
        }
        rows.push(`| ${screen} | ${size.width} | ${theme} | \`${screen}__${size.width}__${theme}.png\` | ${note} |`)
        console.log(`${note.endsWith("DIFFERS") ? "✗" : "✓"} ${screen} ${size.width} ${theme}${note ? `: ${note}` : ""}`)
        await page.close()
      }
    }
  }
} finally {
  await browser.close()
}
const readme = [
  "# Approved screens",
  "",
  `Variant ${variant}, exported from the studio on ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC.`,
  "",
  "Each screen is a reference for the build: `<id>.html` holds the structure, the copy and the classes the model wrote; the PNGs show the approved look at 1440 and 390, light and dark. Build the real screen in the project's stack from `DESIGN.md`, `../tokens.css` and these files. Do not copy the HTML into the app.",
  "",
  "| Screen | Width | Theme | File | Check |",
  "| --- | --- | --- | --- | --- |",
  ...rows,
  "",
]
await writeFile(join(out, "README.md"), readme.join("\n"))
console.log(`${screens.length} screens in ${out}${args.check ? `; ${rows.length - failed} of ${rows.length} renders match the studio within ${threshold}%` : ""}`)
process.exit(failed ? 1 : 0)

// Fonts load only once text uses them, and document.fonts.ready can resolve before
// that starts; wait until no face is still loading, then let layout settle.
async function settle(page) {
  await page.evaluate(async () => {
    for (let i = 0; i < 50; i++) {
      await document.fonts.ready
      if (![...document.fonts].some((face) => face.status === "loading")) break
      await new Promise((done) => setTimeout(done, 100))
    }
  })
  await page.waitForTimeout(300)
}

// Pixel difference between two PNGs, computed in the browser so no image library is needed.
async function compare(page, a, b) {
  const [pngA, pngB] = await Promise.all([readFile(a), readFile(b)])
  return page.evaluate(async ([dataA, dataB]) => {
    const load = (data) => new Promise((done) => { const img = new Image(); img.onload = () => done(img); img.src = `data:image/png;base64,${data}` })
    const [imgA, imgB] = await Promise.all([load(dataA), load(dataB)])
    const sameSize = imgA.width === imgB.width && imgA.height === imgB.height
    const width = Math.min(imgA.width, imgB.width)
    const height = Math.min(imgA.height, imgB.height)
    const read = (img) => { const c = document.createElement("canvas"); c.width = width; c.height = height; const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0); return ctx.getImageData(0, 0, width, height).data }
    const pa = read(imgA), pb = read(imgB)
    let differ = 0
    // A pixel differs when its summed RGB change exceeds 24 of 765: below that is anti-aliasing noise.
    for (let i = 0; i < pa.length; i += 4) {
      if (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]) > 24) differ++
    }
    return { percent: (differ / (width * height)) * 100, sameSize, a: `${imgA.width}×${imgA.height}`, b: `${imgB.width}×${imgB.height}` }
  }, [pngA.toString("base64"), pngB.toString("base64")])
}
