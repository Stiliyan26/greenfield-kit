import { checkFonts, effectiveTokens, familyName } from "./checks.js"
import { createCanvas } from "./canvas.js"
import { createComments } from "./comments.js"
import { icon } from "./icons.js"
import { createInspector } from "./inspector.js"
import { createPalettes } from "./palettes.js"
import { byId, escapeHtml, getJson, isTyping, postJson } from "./util.js"

const store = {
  project: null, selection: null, fonts: {}, blocking: 0,
  saveTimer: null, saving: Promise.resolve(), view: "frame", tab: "colors",
}
const ctx = {
  store,
  round: () => store.project.round || (store.project.worlds.every((world) => world.neutral) ? "layout" : "identity"),
  currentWorld: () => store.project.worlds.find((item) => item.id === store.selection.world),
  currentLayout: () => store.project.layouts.find((item) => item.id === store.selection.layout),
  currentTokens: () => effectiveTokens(store.project, ctx.currentWorld(), store.selection.tuning),
  change, queueSave, save, renderAll, renderFooter, renderRail,
  designChanged() {
    store.selection.status = "draft"
    ctx.inspector.renderChecks()
    ctx.canvas.broadcastTokens()
    renderRail()
    renderFooter()
    ctx.palettes.renderNow()
    queueSave()
  },
}

start()

async function start() {
  try {
    const [project, selection, comments, palettes] = await Promise.all([
      getJson("/api/project"), getJson("/api/selection"), getJson("/api/comments"), getJson("/api/palettes"),
    ])
    store.project = project
    store.selection = selection
    ctx.canvas = createCanvas(ctx)
    ctx.inspector = createInspector(ctx)
    ctx.palettes = createPalettes(ctx, palettes)
    ctx.comments = createComments(ctx)
    ctx.comments.load(comments)
    const fixed = fillDefaults()
    byId("feedback").value = selection.feedback || ""
    decorate()
    listen()
    renderAll()
    if (fixed) queueSave(true)
    else setStatus("Saved")
    refreshFonts()
  } catch (error) {
    setStatus(`Can't load the studio: ${error.message}`)
  }
}

function fillDefaults() {
  const { project, selection } = store
  const before = JSON.stringify(selection)
  if (!project.layouts.some((item) => item.id === selection.layout)) selection.layout = project.layouts[0]?.id ?? null
  if (!project.worlds.some((item) => item.id === selection.world)) selection.world = project.worlds[0]?.id ?? null
  const screens = [...project.screens.map((item) => item.id), "specimen"]
  if (!screens.includes(selection.screen)) selection.screen = project.screens[0]?.id ?? "specimen"
  return before !== JSON.stringify(selection)
}

function decorate() {
  byId("view-frame").innerHTML = icon("frame")
  byId("view-grid").innerHTML = icon("grid")
  byId("palette-prev").innerHTML = icon("left")
  byId("palette-next").innerHTML = icon("right")
  byId("comment-toggle").innerHTML = `${icon("comment")}<span>Comment</span>`
  byId("open-tab").innerHTML = `${icon("external", { size: 14 })}Open alone`
  byId("shortcuts-button").innerHTML = icon("keyboard")
  byId("panels-toggle").innerHTML = icon("panels")
  setPanels(readPanels())
  document.querySelectorAll("dialog [data-close].icon-btn").forEach((button) => { button.innerHTML = icon("x") })
}

function setStatus(text) { byId("save-status").textContent = text }

// --- rendering ------------------------------------------------------------------

function renderAll() {
  renderTop()
  renderRail()
  ctx.canvas.render()
  ctx.inspector.render()
  ctx.palettes.render()
  ctx.comments.render()
  renderFooter()
}

function renderTop() {
  const { project } = store
  document.title = `${project.name} · Design studio`
  byId("product-name").textContent = project.name
  const problems = project._problems || []
  byId("problems").hidden = !problems.length
  byId("problems").innerHTML = `<strong>project.json needs fixing</strong><ul>${problems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
}

function renderRail() {
  const { project, selection } = store
  byId("layout-options").innerHTML = project.layouts.map((layout) => `
    <button type="button" class="option" data-layout="${escapeHtml(layout.id)}" aria-pressed="${selection.layout === layout.id}">
      <span class="option-name">${escapeHtml(layout.name)}</span>
      <span class="option-summary">${escapeHtml(layout.summary)}</span>
    </button>`).join("") || "<p class='hint'>No layouts in project.json yet.</p>"

  byId("world-options").innerHTML = project.worlds.map((world) => {
    const tokens = effectiveTokens(project, world, selection.tuning)
    const strip = ["color-primary", "color-secondary", "color-tertiary", "color-bg", "color-ink"].map((name) => `<span style="background:${escapeHtml(tokens[name])}"></span>`).join("")
    const palette = selection.palette?.[world.id]
    return `<button type="button" class="option" data-world="${escapeHtml(world.id)}" aria-pressed="${selection.world === world.id}">
      <span class="option-name">${escapeHtml(world.name)}${world.neutral ? " <span class='tag'>neutral</span>" : ""}</span>
      <span class="option-summary">${escapeHtml(world.summary || "")}</span>
      <span class="option-fonts mono">${escapeHtml(familyName(world.fonts?.display || ""))} / ${escapeHtml(familyName(world.fonts?.body || ""))}${palette ? ` · ${escapeHtml(palette.name)}` : ""}</span>
      <span class="strip">${strip}</span>
    </button>`
  }).join("") || "<p class='hint'>No worlds in project.json yet.</p>"

  const references = (project.references || []).filter((item) => !item.screens || item.screens.includes(selection.screen))
  byId("reference-count").textContent = references.length || ""
  byId("references").innerHTML = references.map((item, index) => `
    <button type="button" class="reference-thumb" data-reference="${index}" title="${escapeHtml(item.note || item.title || "")}">
      ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.app)}: ${escapeHtml(item.title || "")}" loading="lazy">` : ""}
      <span>${escapeHtml(item.app || item.title || "Reference")}</span>
    </button>`).join("") || "<p class='hint'>No references yet.</p>"
  byId("round-label").textContent = ctx.round() === "layout" ? "Layout round: judge the arrangement in neutral grey, or preview palettes on it." : "Identity round: choose and tune a complete look."

  const tokens = ctx.currentWorld() ? ctx.currentTokens() : null
  if (tokens) {
    const mark = document.querySelector(".brand-mark")
    ;["color-primary", "color-secondary", "color-tertiary", "color-bg"].forEach((name, index) => mark.style.setProperty(`--mark-${index + 1}`, tokens[name]))
  }
}

function renderFooter() {
  const { selection, project } = store
  const world = ctx.currentWorld()
  const layout = ctx.currentLayout()
  const approved = selection.status === "approved"
  const layoutRound = ctx.round() === "layout"

  const steps = { layout: selection.layoutChoice ? "done" : layoutRound ? "current" : "done", identity: approved ? "done" : layoutRound ? "todo" : "current", approved: approved ? "done" : "todo" }
  document.querySelectorAll("#stepper li").forEach((item) => { item.dataset.state = steps[item.dataset.step] })

  const revision = byId("revision-label")
  revision.textContent = `Rev ${selection.revision} · ${approved ? "Approved" : "Draft"}`
  revision.dataset.state = approved ? "approved" : "draft"
  const exported = selection.exported
  const outdated = Boolean(exported && exported.revision !== selection.revision)
  const label = byId("export-label")
  label.textContent = exported ? (outdated ? `DESIGN.md is from rev ${exported.revision}` : "DESIGN.md is current") : ""
  label.dataset.outdated = String(outdated)

  const choose = byId("choose-layout")
  choose.hidden = !layoutRound
  const chosen = selection.layoutChoice?.layout === selection.layout
  choose.disabled = !layout || chosen
  choose.textContent = chosen ? `${layout?.name} chosen` : `Choose ${layout?.name ?? "layout"}`

  const approve = byId("approve")
  approve.hidden = layoutRound
  const reasons = []
  if ((project._problems || []).length) reasons.push("fix project.json")
  if (world?.neutral) reasons.push("the neutral world is only for choosing a layout")
  if (store.blocking) reasons.push(`${store.blocking} check${store.blocking > 1 ? "s" : ""} failing`)
  if (world && !store.fonts[world.id]) reasons.push("the font check is still running")
  approve.disabled = approved || reasons.length > 0
  approve.textContent = approved ? `Rev ${selection.revision} approved` : `Approve rev ${selection.revision}`

  let hint = ""
  if (layoutRound) hint = chosen ? "Layout chosen. The agent builds complete worlds for it next." : "Choose the arrangement that works best. Palettes here are only a preview."
  else if (approved) hint = "Approved. Any change returns this to a draft."
  else hint = reasons.length ? `Can't approve yet: ${reasons.join("; ")}.` : "Approve writes DESIGN.md and design/tokens.css."
  byId("approve-hint").textContent = hint
}

// --- saving ---------------------------------------------------------------------

function change(next) {
  Object.assign(store.selection, next)
  renderAll()
  refreshFonts()
  queueSave()
}

function queueSave(immediate = false) {
  clearTimeout(store.saveTimer)
  setStatus("Saving…")
  if (immediate) return save()
  store.saveTimer = setTimeout(save, 350)
  return store.saving
}

function save() {
  clearTimeout(store.saveTimer)
  const { screen, layout, world, width, tuning, feedback, palette, shortlist } = store.selection
  const body = { screen, layout, world, width, tuning, feedback, palette, shortlist }
  store.saving = store.saving.then(async () => {
    const saved = await postJson("/api/selection", body)
    for (const key of ["status", "revision", "approvedAt", "exported", "layoutChoice"]) store.selection[key] = saved[key]
    setStatus("Saved")
    renderFooter()
    return true
  }).catch((error) => {
    setStatus(`Not saved: ${error.message}`)
    return false
  })
  return store.saving
}

async function refreshFonts() {
  const world = ctx.currentWorld()
  if (!world || world.id in store.fonts) return
  store.fonts[world.id] = null
  store.fonts[world.id] = await checkFonts(world, store.project.scripts || [])
  if (ctx.currentWorld()?.id === world.id) { ctx.inspector.renderChecks(); renderFooter() }
}

// --- events ----------------------------------------------------------------------

function listen() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("button")
    if (!target) return
    if (target.classList.contains("cell")) { change({ world: target.dataset.world, ...(target.dataset.layout ? { layout: target.dataset.layout } : {}) }); ctx.canvas.setView("frame") }
    else if (target.dataset.layout) change({ layout: target.dataset.layout })
    else if (target.dataset.world) change({ world: target.dataset.world })
    else if (target.dataset.screen) change({ screen: target.dataset.screen })
    else if (target.dataset.width) change({ width: Number(target.dataset.width) })
    else if (target.dataset.reference) openReference(Number(target.dataset.reference))
    else if (target.dataset.tab) ctx.inspector.setTab(target.dataset.tab)
    else if (target.hasAttribute("data-close")) target.closest("dialog")?.close()
  })

  byId("feedback").addEventListener("input", (event) => { store.selection.feedback = event.target.value; queueSave() })
  byId("shortcuts-button").addEventListener("click", () => byId("shortcuts-dialog").showModal())
  byId("panels-toggle").addEventListener("click", () => setPanels(document.body.classList.contains("panels-hidden")))

  byId("choose-layout").addEventListener("click", async () => {
    if (!await save()) return
    try {
      Object.assign(store.selection, await postJson("/api/choose-layout", { revision: store.selection.revision }))
      setStatus("Layout chosen")
    } catch (error) { setStatus(error.message) }
    renderFooter()
  })

  byId("approve").addEventListener("click", async () => {
    if (!await save()) return
    try {
      const saved = await postJson("/api/approve", { revision: store.selection.revision, fontChecks: store.fonts[store.selection.world] || {} })
      for (const key of ["status", "revision", "approvedAt", "exported"]) store.selection[key] = saved[key]
      setStatus(`Approved. Wrote ${saved.exported.files.join(" and ")}`)
    } catch (error) { setStatus(error.message) }
    renderFooter()
  })

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event)) return
    const key = event.key
    if (key === "ArrowRight" || key === "ArrowLeft") { event.preventDefault(); ctx.palettes.step(key === "ArrowRight" ? 1 : -1) }
    else if (key === "s" || key === "S") ctx.palettes.toggleStar()
    else if (key === "c" || key === "C") ctx.comments.toggle()
    else if (key === "g" || key === "G") ctx.canvas.setView(store.view === "frame" ? "grid" : "frame")
    else if (key === "f" || key === "F") ctx.canvas.toggleFit()
    else if (key === "p" || key === "P") setPanels(document.body.classList.contains("panels-hidden"))
    else if (["1", "2", "3"].includes(key)) change({ width: [1440, 1024, 390][Number(key) - 1] })
    else if (key === "?") byId("shortcuts-dialog").showModal()
  })

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return
    const frame = ctx.canvas.previewFrame()
    const message = event.data || {}
    if (event.source !== frame?.contentWindow) return
    if (message.type === "height") ctx.canvas.setFrameHeight(message.height)
    if (message.type === "ready") { ctx.canvas.broadcastTokens(); ctx.comments.frameReady() }
    ctx.comments.handleMessage(message)
  })
}

// Side panels are a per-viewer preference, so they live in localStorage.
function readPanels() {
  try { return localStorage.getItem("studio-panels") !== "hidden" } catch { return true }
}

function setPanels(show) {
  document.body.classList.toggle("panels-hidden", !show)
  byId("panels-toggle").setAttribute("aria-pressed", String(show))
  try { localStorage.setItem("studio-panels", show ? "shown" : "hidden") } catch { /* private window: keep it for this visit */ }
}

function openReference(index) {
  const references = (store.project.references || []).filter((item) => !item.screens || item.screens.includes(store.selection.screen))
  const item = references[index]
  if (!item) return
  const holder = byId("reference-image")
  holder.replaceChildren()
  if (item.image) {
    const image = document.createElement("img")
    image.src = item.image
    image.alt = `${item.app}: ${item.title || ""}`
    holder.append(image)
  }
  byId("reference-app").textContent = `${item.app || ""}${item.title ? ` · ${item.title}` : ""}`
  byId("reference-note").textContent = item.note || ""
  const link = byId("reference-link")
  link.hidden = !item.url
  if (item.url) link.href = item.url
  byId("reference-dialog").showModal()
}
