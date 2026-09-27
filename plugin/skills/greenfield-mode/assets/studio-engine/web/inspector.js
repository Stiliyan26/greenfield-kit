// Inspector tabs: Tune (per-token OKLCH sliders) and Checks. Colors and Comments have their own modules.
import { effectiveTokens, runChecks } from "./checks.js"
import { format, parse, toHex } from "./color.js"
import { icon } from "./icons.js"
import { byId, escapeHtml } from "./util.js"

const GROUPS = [
  ["Surfaces", ["color-bg", "color-surface", "color-surface-2", "color-line"]],
  ["Text", ["color-ink", "color-muted"]],
  ["Primary", ["color-primary", "color-on-primary", "color-primary-soft"]],
  ["Secondary", ["color-secondary", "color-on-secondary", "color-secondary-soft"]],
  ["Tertiary and accent", ["color-tertiary", "color-on-tertiary", "color-tertiary-soft", "color-accent"]],
]

export function createInspector(ctx) {
  const { store } = ctx
  let tunerKey = ""

  byId("tuner").addEventListener("input", onSlide)
  byId("reset-tuning").addEventListener("click", () => {
    const world = store.selection.variant
    const tuning = { ...store.selection.tuning }
    const palette = { ...store.selection.palette }
    delete tuning[world]
    delete palette[world]
    Object.assign(store.selection, { tuning, palette })
    tunerKey = ""
    renderTuner()
    ctx.designChanged()
  })

  function setTab(tab) {
    store.tab = tab
    document.querySelectorAll(".tabs [data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.tab === tab)))
    document.querySelectorAll(".panel[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== tab })
  }

  function render() {
    setTab(store.tab)
    renderTuner()
    renderChecks()
  }

  function baseTokens() {
    const world = ctx.currentWorld()
    return effectiveTokens(store.project, world, { [world.id]: {} })
  }

  function renderTuner() {
    const world = ctx.currentWorld()
    if (!world) return
    const key = `${world.id}|${JSON.stringify(store.selection.tuning[world.id] || {})}`
    if (key === tunerKey) return
    tunerKey = key
    const tokens = ctx.currentTokens()
    const base = baseTokens()
    const open = new Set([...byId("tuner").querySelectorAll("details[open]")].map((item) => item.dataset.token))
    const known = new Set(GROUPS.flatMap(([, names]) => names))
    const extra = Object.keys(tokens).filter((name) => name.startsWith("color-") && !known.has(name))
    const groups = [...GROUPS, ...(extra.length ? [["Other", extra]] : [])]
    const html = groups.map(([title, names]) => `
      <div class="token-group"><h3>${title}</h3>
        ${names.filter((name) => name in tokens).map((name) => tokenRow(name, tokens[name], tokens[name] !== base[name])).join("")}
      </div>`)
    html.push(`<div class="token-group"><h3>Status, locked for the product</h3>
      ${Object.entries(store.project.status || {}).map(([name, value]) => `
        <div class="token locked"><summary><span class="swatch" style="background:${escapeHtml(value)}"></span><span class="token-name">${escapeHtml(name)}</span>${icon("lock", { size: 13 })}<code>${toHex(value)}</code></summary></div>`).join("")}
    </div>`)
    byId("tuner").innerHTML = html.join("")
    byId("tuner").querySelectorAll("details").forEach((item) => { item.open = open.has(item.dataset.token) })
  }

  function tokenRow(name, value, changed) {
    const lch = parse(value)
    return `<details class="token" data-token="${name}">
      <summary><span class="swatch" style="background:${escapeHtml(value)}"></span><span class="token-name">${name.replace("color-", "")}</span>${changed ? '<span class="changed" title="Changed from the world"></span>' : ""}<code>${toHex(value)}</code></summary>
      <div class="sliders">
        ${slider("L", "Lightness", lch[0], 0, 1, 0.005, tracks(lch).L)}
        ${slider("C", "Chroma", lch[1], 0, 0.37, 0.002, tracks(lch).C)}
        ${slider("H", "Hue", lch[2], 0, 360, 1, tracks(lch).H)}
      </div></details>`
  }

  function onSlide(event) {
    const input = event.target.closest("input[type=range]")
    if (!input) return
    const details = input.closest("details")
    const lch = [...details.querySelectorAll("input")].map((item) => Number(item.value))
    const value = format(lch)
    const world = store.selection.variant
    store.selection.tuning = { ...store.selection.tuning, [world]: { ...(store.selection.tuning[world] || {}), [details.dataset.token]: value } }
    tunerKey = `${world}|${JSON.stringify(store.selection.tuning[world])}`
    input.nextElementSibling.textContent = input.dataset.channel === "H" ? Number(input.value).toFixed(0) : Number(input.value).toFixed(3)
    details.querySelector(".swatch").style.background = value
    details.querySelector("code").textContent = toHex(value)
    const track = tracks(lch)
    details.querySelectorAll("input").forEach((item) => item.style.setProperty("--track", track[item.dataset.channel]))
    ctx.designChanged()
  }

  function renderChecks() {
    const world = ctx.currentWorld()
    if (!world) return
    const row = (state, label, value = "") => `<li data-state="${state}">${icon(state === "pass" ? "check" : state === "fail" ? "x" : "alert", { size: 15 })}<span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></li>`
    // Approval checks every theme the product has, so the panel does too.
    const wantsDark = (store.project._themes || ["light"]).includes("dark")
    const looks = [["", runChecks(store.project, ctx.currentTokens("light"))]]
    if (wantsDark && world.dark) looks.push([" (dark)", runChecks(store.project, ctx.currentTokens("dark"))])
    const results = looks.flatMap(([, list]) => list)
    const groups = looks.map(([suffix, list]) => {
      const contrast = list.filter((check) => check.kind === "contrast").map((check) => row(check.pass ? "pass" : "fail", check.label, `${check.ratio.toFixed(2)} / ${check.minimum}`))
      const hue = list.filter((check) => check.kind !== "contrast").map((check) => row(check.pass ? (check.warning ? "warn" : "pass") : "fail", check.label, check.kind === "hue" ? `${Math.round(check.distance)}°` : ""))
      return `<li class="group">Contrast${suffix}</li>${contrast.join("")}<li class="group">Status colors stay distinct${suffix}</li>${hue.join("")}`
    }).join("")
    const noDark = wantsDark && !world.dark ? 1 : 0
    const fonts = store.fonts[world.id]
    let fontFailures = 0
    const fontRows = fonts ? Object.entries(fonts).map(([family, result]) => {
      const state = result === "ok" ? "pass" : result.startsWith("missing") ? "fail" : "warn"
      if (state === "fail") fontFailures += 1
      return row(state, `${family}: ${result === "ok" ? `covers ${(store.project.scripts || ["latin"]).join(", ")}` : result}`)
    }) : [row("warn", `Checking fonts for ${(store.project.scripts || ["latin"]).join(", ")}`)]
    const darkRow = noDark ? `<li class="group">Dark look</li>${row("fail", `${world.name || world.id} has no dark look yet (world.dark in variant.json)`)}` : ""
    byId("checks").innerHTML = `${groups}${darkRow}<li class="group">Fonts</li>${fontRows.join("")}`
    store.blocking = results.filter((check) => !check.pass).length + fontFailures + noDark
    const total = results.length + (fonts ? Object.keys(fonts).length : 0) + noDark
    const summary = byId("check-summary")
    summary.dataset.state = store.blocking ? "fail" : "pass"
    summary.innerHTML = store.blocking ? `${icon("x")}${store.blocking} of ${total} checks fail` : `${icon("check")}All ${total} checks pass`
    const badge = byId("check-badge")
    badge.innerHTML = store.blocking ? String(store.blocking) : icon("check", { size: 11 })
    badge.dataset.state = store.blocking ? "fail" : "pass"
  }

  return { render, renderTuner, renderChecks, setTab, resetKey() { tunerKey = "" } }
}

function slider(channel, label, value, min, max, step, track) {
  const shown = channel === "H" ? value.toFixed(0) : value.toFixed(3)
  return `<label><span>${channel}</span><input type="range" data-channel="${channel}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label}" style="--track:${track}"><output>${shown}</output></label>`
}

// Slider tracks show where each channel would take the color.
function tracks([lightness, chroma, hue]) {
  const stops = (make, count) => Array.from({ length: count }, (_, index) => make(index / (count - 1))).join(", ")
  return {
    L: `linear-gradient(90deg, ${stops((t) => `oklch(${t.toFixed(2)} ${chroma.toFixed(3)} ${hue.toFixed(0)})`, 6)})`,
    C: `linear-gradient(90deg, ${stops((t) => `oklch(${lightness.toFixed(2)} ${(t * 0.37).toFixed(3)} ${hue.toFixed(0)})`, 5)})`,
    H: `linear-gradient(90deg, ${stops((t) => `oklch(${lightness.toFixed(2)} ${Math.max(chroma, 0.06).toFixed(3)} ${Math.round(t * 360)})`, 13)})`,
  }
}
