// Colors tab: the applied palette, the palette library, and palettes generated from one color.
import { effectiveTokens, runChecks } from "./checks.js"
import { fit, format, onColor, paletteTokens, parse, tonalScale, toHex } from "./color.js"
import { icon } from "./icons.js"
import { byId, escapeHtml, postJson } from "./util.js"

const ROLES = ["primary", "secondary", "tertiary", "neutral"]
const TAG_ORDER = ["warm", "cool", "earthy", "vivid", "muted", "mono", "dark", "contrast", "custom"]

export function createPalettes(ctx, { library, custom }) {
  const { store } = ctx
  const panel = byId("panel-colors")
  const filter = { mood: "all", shortlist: false, query: "", hideFailing: false }
  let saved = custom
  let generated = []
  let editingRole = null
  const tokenCache = new Map()
  const fitCache = new Map()

  panel.innerHTML = shell()
  listen()

  // --- data -----------------------------------------------------------------

  const all = () => [...library, ...saved]
  const seedsOf = (entry) => Object.fromEntries(ROLES.map((role) => [role, entry[role]]))
  const applied = () => store.selection.palette?.[store.selection.variant] || null
  const modelName = (variant) => variant?.model || variant?.id || "The model"
  const ownName = () => `${modelName(ctx.currentVariant())}'s colors`

  // A model's colors are changed when it has a palette or tuning in selection.json. Its
  // original colors stay in variant.json, which the studio never writes.
  const changed = (variantId) => Boolean(store.selection.palette?.[variantId] || Object.keys(store.selection.tuning[variantId] || {}).length)

  function tokensFor(seeds) {
    const key = JSON.stringify(seeds)
    if (!tokenCache.has(key)) tokenCache.set(key, paletteTokens(seeds))
    return tokenCache.get(key)
  }

  // Does this palette pass every check for the current world and the project's status colors?
  function fitFor(entry) {
    const world = ctx.currentWorld()
    const key = `${world.id}|${entry.id}|${ROLES.map((role) => entry[role]).join()}`
    if (!fitCache.has(key)) {
      const tokens = effectiveTokens(store.project, world, { [world.id]: tokensFor(seedsOf(entry)) })
      const failing = runChecks(store.project, tokens).filter((check) => !check.pass)
      const clash = failing.some((check) => check.kind === "hue")
      fitCache.set(key, { pass: !failing.length, label: clash ? "Clashes" : "Contrast", title: failing.map((check) => check.label).join("; ") })
    }
    return fitCache.get(key)
  }

  function visible() {
    const query = filter.query.trim().toLowerCase()
    return all().filter((entry) => {
      if (filter.shortlist && !store.selection.shortlist.includes(entry.id)) return false
      if (filter.mood !== "all" && !entry.tags.includes(filter.mood)) return false
      if (query && !`${entry.name} ${entry.tags.join(" ")}`.toLowerCase().includes(query)) return false
      if (filter.hideFailing && !fitFor(entry).pass) return false
      return true
    })
  }

  // Seeds for the role cards: the applied palette, or the world's own colors.
  function currentSeeds() {
    const palette = applied()
    if (palette) return palette.seeds
    const tokens = ctx.currentTokens()
    return { primary: toHex(tokens["color-primary"]), secondary: toHex(tokens["color-secondary"]), tertiary: toHex(tokens["color-tertiary"]), neutral: toHex(tokens["color-bg"]) }
  }

  function isTuned() {
    const palette = applied()
    const tuning = store.selection.tuning[store.selection.variant] || {}
    if (!palette) return Object.keys(tuning).length > 0
    const expected = tokensFor(palette.seeds)
    return Object.keys({ ...expected, ...tuning }).some((name) => expected[name] !== tuning[name])
  }

  // --- actions ----------------------------------------------------------------

  function apply(entry, { name = entry.name, id = entry.id } = {}) {
    const world = store.selection.variant
    const seeds = seedsOf(entry)
    store.selection.palette = { ...store.selection.palette, [world]: { id, name, seeds } }
    store.selection.tuning = { ...store.selection.tuning, [world]: tokensFor(seeds) }
    ctx.inspector.resetKey()
    ctx.inspector.renderTuner()
    ctx.designChanged()
    renderCurrent()
    markRows()
  }

  function step(direction) {
    const list = visible()
    if (!list.length) return
    const index = list.findIndex((entry) => entry.id === applied()?.id)
    const next = list[(index + direction + list.length) % list.length] || list[0]
    apply(next)
    panel.querySelector(`[data-palette="${CSS.escape(next.id)}"]`)?.scrollIntoView({ block: "nearest" })
  }

  function toggleStar(id = applied()?.id) {
    if (!id) return
    const list = store.selection.shortlist
    store.selection.shortlist = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
    renderList()
    ctx.queueSave()
  }

  function editSeed(role, hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return
    const seeds = { ...currentSeeds(), [role]: hex.toLowerCase() }
    const base = applied()
    const name = base ? (base.name.endsWith(" (edited)") ? base.name : `${base.name} (edited)`) : "Custom"
    apply({ ...seeds, id: "edited", name })
  }

  function generate(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return
    const [lightness, chroma, hue] = parse(hex)
    const clampL = (value) => Math.min(0.85, Math.max(0.2, value))
    const make = (l, c, h) => toHex(format(fit([clampL(l), Math.max(0, c), ((h % 360) + 360) % 360])))
    const neutral = (h) => toHex(format(fit([0.93, Math.min(0.014, chroma * 0.15), h])))
    const recipes = [
      ["Monochrome", [lightness - 0.1, chroma * 0.85, hue], [lightness + 0.14, chroma * 0.9, hue], hue],
      ["Analogous", [lightness - 0.08, chroma * 0.9, hue - 25], [lightness + 0.08, chroma, hue + 35], hue],
      ["Complementary", [lightness - 0.1, chroma * 0.7, hue], [0.62, chroma, hue + 180], hue],
      ["Split complementary", [lightness - 0.08, chroma * 0.8, hue + 150], [0.64, chroma, hue + 210], hue],
      ["Triadic", [lightness - 0.05, chroma * 0.8, hue + 120], [0.64, chroma, hue + 240], hue],
    ]
    generated = recipes.map(([name, secondary, tertiary, neutralHue]) => ({
      id: `generated-${name.toLowerCase().replace(/ /g, "-")}`, name: `${name} of ${hex.toUpperCase()}`, tags: ["generated"],
      primary: hex.toLowerCase(), secondary: make(...secondary), tertiary: make(...tertiary), neutral: neutral(neutralHue),
    }))
    renderGenerated()
  }

  async function saveCurrent(name) {
    const seeds = currentSeeds()
    const entry = await postJson("/api/palettes", { name, ...seeds })
    saved = [...saved, entry]
    apply(entry)
    renderFilters()
    renderList()
  }

  // --- rendering ----------------------------------------------------------------

  function render() {
    renderCurrent()
    renderFilters()
    renderList()
    if (generated.length) renderGenerated()
    else generate(byId("seed-text").value)
    renderNow()
  }

  function renderCurrent() {
    const seeds = currentSeeds()
    const palette = applied()
    byId("palette-model").textContent = `Editing ${modelName(ctx.currentVariant())}`
    byId("palette-name").textContent = palette ? palette.name : ownName()
    byId("palette-state").textContent = isTuned() ? "tuned" : palette ? "" : "as the model chose"
    byId("roles").innerHTML = ROLES.map((role) => {
      const hex = toHex(seeds[role])
      const label = role[0].toUpperCase() + role.slice(1)
      return `<div class="role" data-role="${role}">
        <button type="button" class="role-fill" data-role-edit="${role}" style="background:${hex};color:${onColor(hex)}" aria-expanded="${editingRole === role}" title="Change the ${role} color">
          <strong>${label}</strong><code>${hex.toUpperCase()}</code>
        </button>
        <div class="tones" aria-label="${label} tones">${tonalScale(hex).map((tone) => `<span style="background:${tone.hex}" title="${label} ${tone.step}: ${tone.hex}"></span>`).join("")}</div>
        ${editingRole === role ? `<div class="role-editor"><input type="color" value="${hex}" data-seed-color="${role}" aria-label="${label} color"><input type="text" value="${hex}" data-seed-text="${role}" spellcheck="false" aria-label="${label} hex"></div>` : ""}
      </div>`
    }).join("")
    byId("status-swatches").innerHTML = Object.entries(store.project.status || {}).map(([name, value]) => `<i style="background:${escapeHtml(value)}" title="${escapeHtml(name)}: ${escapeHtml(store.project.statusMeaning?.[name] || "")}"></i>`).join("")
    byId("palette-clear").disabled = !palette && !Object.keys(store.selection.tuning[store.selection.variant] || {}).length
    byId("palette-clear").innerHTML = `${icon("reset", { size: 14 })}Restore ${escapeHtml(ownName())}`
  }

  function renderFilters() {
    const present = new Set(all().flatMap((entry) => entry.tags))
    const moods = TAG_ORDER.filter((tag) => present.has(tag))
    const count = store.selection.shortlist.length
    byId("palette-filters").innerHTML = `
      <label class="sr-only" for="palette-mood">Mood</label>
      <select id="palette-mood">${["all", ...moods].map((mood) => `<option value="${mood}"${filter.mood === mood ? " selected" : ""}>${mood === "all" ? "Every mood" : mood[0].toUpperCase() + mood.slice(1)}</option>`).join("")}</select>
      <button type="button" data-filter="shortlist" aria-pressed="${filter.shortlist}">${icon("star", { size: 13, filled: filter.shortlist })}Shortlist${count ? ` ${count}` : ""}</button>`
  }

  function row(entry) {
    const fitResult = fitFor(entry)
    const starred = store.selection.shortlist.includes(entry.id)
    const chip = ROLES.map((role) => `<i style="background:${entry[role]}"></i>`).join("")
    return `<li class="palette-row" data-palette="${escapeHtml(entry.id)}" aria-current="${applied()?.id === entry.id}">
      <button type="button" class="palette-apply" data-apply="${escapeHtml(entry.id)}" title="Apply ${escapeHtml(entry.name)}">
        <span class="chip4">${chip}</span>
        <span class="palette-text"><span class="name">${escapeHtml(entry.name)}</span><span class="tags">${escapeHtml(entry.tags.join(", "))}</span></span>
      </button>
      <span class="fit" data-state="${fitResult.pass ? "pass" : "fail"}" title="${escapeHtml(fitResult.pass ? "Passes every check for this project" : fitResult.title)}">${fitResult.pass ? icon("check", { size: 13 }) : `${icon("alert", { size: 13 })}${fitResult.label}`}</span>
      ${entry.tags.includes("generated") ? "<span></span>" : `<button type="button" class="star" data-star="${escapeHtml(entry.id)}" aria-pressed="${starred}" aria-label="${starred ? "Remove from" : "Add to"} shortlist">${icon("star", { size: 15, filled: starred })}</button>`}
    </li>`
  }

  // Every model's original colors, each with its own Restore, and Restore all.
  function renderOriginals() {
    const variants = store.project.variants
    byId("original-list").innerHTML = variants.map((variant) => {
      const tokens = effectiveTokens(store.project, variant.world, {})
      const chip = ["color-primary", "color-secondary", "color-tertiary", "color-bg"].map((name) => `<i style="background:${escapeHtml(tokens[name])}"></i>`).join("")
      const palette = store.selection.palette?.[variant.id]
      const state = !changed(variant.id) ? "Original" : palette ? `Now: ${palette.name}` : "Now: tuned"
      return `<li class="original-row" data-original="${escapeHtml(variant.id)}" aria-current="${variant.id === store.selection.variant}">
        <span class="chip4">${chip}</span>
        <span class="palette-text"><span class="name">${escapeHtml(modelName(variant))}</span><span class="tags" data-changed="${changed(variant.id)}">${escapeHtml(state)}</span></span>
        <button type="button" class="btn btn-quiet btn-small" data-restore="${escapeHtml(variant.id)}"${changed(variant.id) ? "" : " disabled"}>Restore</button>
      </li>`
    }).join("")
    byId("restore-all").disabled = !variants.some((variant) => changed(variant.id))
  }

  function renderList() {
    renderOriginals()
    const list = visible()
    byId("library-count").textContent = `${list.length} of ${all().length}`
    byId("palette-list").innerHTML = list.map(row).join("") || `<li class="empty-note">${filter.shortlist ? "Star palettes with S or the star to build a shortlist." : "No palettes match."}</li>`
  }

  function renderGenerated() {
    byId("generated-list").innerHTML = generated.map(row).join("")
  }

  function markRows() {
    const id = applied()?.id
    const own = `model:${store.selection.variant}`
    panel.querySelectorAll(".palette-row").forEach((item) => item.setAttribute("aria-current", String(item.dataset.palette === own ? !id && !isTuned() : item.dataset.palette === id)))
  }

  // The canvas bar shows the applied palette, so browsing works without the panel open.
  // Every color change (palette, arrow keys, tuning, restore) passes through here, so the
  // Original colors list and its Restore buttons stay current too.
  function renderNow() {
    renderOriginals()
    const palette = applied()
    const seeds = currentSeeds()
    byId("palette-now").innerHTML = `<span class="dots">${ROLES.map((role) => `<i style="background:${toHex(seeds[role])}"></i>`).join("")}</span><span>${escapeHtml(palette ? palette.name : ownName())}${isTuned() ? "<em>tuned</em>" : ""}</span>`
    const state = byId("palette-state")
    if (state) state.textContent = isTuned() ? "tuned" : palette ? "" : "as the model chose"
  }

  // --- events -------------------------------------------------------------------

  function listen() {
    panel.addEventListener("click", (event) => {
      const button = event.target.closest("button")
      if (!button) return
      if (button.dataset.apply) {
        const entry = [...all(), ...generated].find((item) => item.id === button.dataset.apply)
        if (entry) apply(entry)
      } else if (button.dataset.star) toggleStar(button.dataset.star)
      else if (button.dataset.filter === "shortlist") { filter.shortlist = !filter.shortlist; renderFilters(); renderList() }
      else if (button.dataset.roleEdit) { editingRole = editingRole === button.dataset.roleEdit ? null : button.dataset.roleEdit; renderCurrent() }
      else if (button.id === "palette-clear") clear()
      else if (button.dataset.restore) clear([button.dataset.restore])
      else if (button.id === "restore-all") clear(store.project.variants.map((variant) => variant.id))
      else if (button.id === "palette-save") { byId("save-form").hidden = false; byId("save-name").focus() }
    })
    panel.addEventListener("input", (event) => {
      const target = event.target
      if (target.id === "palette-search") { filter.query = target.value; renderList() }
      else if (target.dataset.seedColor) editSeed(target.dataset.seedColor, target.value)
      else if (target.dataset.seedText && /^#[0-9a-f]{6}$/i.test(target.value)) editSeed(target.dataset.seedText, target.value)
      else if (target.id === "seed-color") { byId("seed-text").value = target.value; generate(target.value) }
      else if (target.id === "seed-text") { if (/^#[0-9a-f]{6}$/i.test(target.value)) { byId("seed-color").value = target.value; generate(target.value) } }
    })
    panel.addEventListener("change", (event) => {
      if (event.target.id === "hide-failing") { filter.hideFailing = event.target.checked; renderList() }
      if (event.target.id === "palette-mood") { filter.mood = event.target.value; renderList() }
    })
    byId("save-form").addEventListener("submit", async (event) => {
      event.preventDefault()
      const name = byId("save-name").value.trim()
      if (!name) return
      try {
        await saveCurrent(name)
        byId("save-form").hidden = true
        byId("save-name").value = ""
      } catch (error) { byId("save-error").textContent = error.message }
    })
    byId("save-cancel").addEventListener("click", () => { byId("save-form").hidden = true })
    byId("palette-prev").addEventListener("click", () => step(-1))
    byId("palette-next").addEventListener("click", () => step(1))
  }

  // Restore the listed models (default: the selected one) to the colors in their variant.json.
  // Only those models change; every other model keeps its own palette and tuning.
  function clear(variantIds = [store.selection.variant]) {
    const tuning = { ...store.selection.tuning }
    const palette = { ...store.selection.palette }
    for (const id of variantIds) { delete tuning[id]; delete palette[id] }
    Object.assign(store.selection, { tuning, palette })
    ctx.inspector.resetKey()
    ctx.inspector.renderTuner()
    ctx.designChanged()
    for (const id of variantIds) ctx.canvas.broadcastTokens(store.project.variants.find((variant) => variant.id === id)?.world)
    renderCurrent()
    renderOriginals()
    markRows()
  }

  return {
    render,
    renderNow,
    step,
    toggleStar,
  }
}

function shell() {
  return `
    <section class="current-palette" aria-labelledby="palette-name">
      <p id="palette-model" class="palette-model"></p>
      <div class="current-head"><h2 id="palette-name">Model colors</h2><span id="palette-state" class="meta"></span></div>
      <div id="roles" class="roles"></div>
      <div class="status-row">${icon("lock", { size: 13 })}<span>Status colors are locked</span><span id="status-swatches" class="swatches"></span></div>
      <div class="current-actions">
        <button type="button" id="palette-save" class="btn btn-small">${icon("plus", { size: 14 })}Save to library</button>
        <button type="button" id="palette-clear" class="btn btn-quiet btn-small">${icon("reset", { size: 14 })}Restore the model's colors</button>
      </div>
      <form id="save-form" class="generate-input" hidden>
        <input type="text" id="save-name" maxlength="60" placeholder="Palette name" aria-label="Palette name">
        <button type="submit" class="btn btn-primary btn-small">Save</button>
        <button type="button" id="save-cancel" class="btn btn-quiet btn-small">Cancel</button>
        <span id="save-error" class="hint"></span>
      </form>
    </section>
    <section class="library" aria-label="Original colors">
      <div class="panel-head"><h2 class="section-title">Original colors</h2><button type="button" id="restore-all" class="btn btn-quiet btn-small">${icon("reset", { size: 14 })}Restore all</button></div>
      <p class="hint">The colors each model chose. Restore puts back only that model's colors.</p>
      <ul id="original-list" class="palette-list"></ul>
    </section>
    <section class="library" aria-label="Palette library">
      <div class="panel-head"><h2 class="section-title">Library <span id="library-count" class="count"></span></h2><span class="meta"><kbd>←</kbd> <kbd>→</kbd> browse</span></div>
      <label class="search">${icon("search", { size: 15 })}<span class="sr-only">Search palettes</span><input type="search" id="palette-search" placeholder="Search by name or mood"></label>
      <div id="palette-filters" class="filters" role="group" aria-label="Filter palettes"></div>
      <label class="toggle"><input type="checkbox" id="hide-failing"> Hide palettes that fail this project's checks</label>
      <ul id="palette-list" class="palette-list"></ul>
    </section>
    <section class="generate" aria-label="Generate palettes">
      <h2 class="section-title">Generate from one color</h2>
      <div class="generate-input">
        <input type="color" id="seed-color" value="#2f5d8a" aria-label="Seed color">
        <input type="text" id="seed-text" value="#2f5d8a" spellcheck="false" aria-label="Seed hex">
      </div>
      <ul id="generated-list" class="palette-list"></ul>
    </section>`
}
