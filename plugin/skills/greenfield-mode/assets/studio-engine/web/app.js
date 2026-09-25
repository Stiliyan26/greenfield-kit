import { checkFonts, effectiveTokens } from "./checks.js"
import { createBoard } from "./board.js"
import { createCanvas, screenGroups, VIEWS } from "./canvas.js"
import { createComments } from "./comments.js"
import { icon } from "./icons.js"
import { createInspector } from "./inspector.js"
import { createPalettes } from "./palettes.js"
import { byId, escapeHtml, getJson, isTyping, postJson } from "./util.js"

const store = {
  project: null, selection: null, fonts: {}, blocking: 0,
  saveTimer: null, saving: Promise.resolve(), view: "model", tab: "colors",
}
// Each variant is one model's design; its look (world) has the variant's id.
const ctx = {
  store,
  currentVariant: () => store.project.variants.find((item) => item.id === store.selection.variant),
  currentWorld: () => ctx.currentVariant()?.world,
  currentTokens: () => effectiveTokens(store.project, ctx.currentWorld(), store.selection.tuning),
  change, queueSave, save, renderAll, renderFooter, renderRail,
  designChanged() {
    store.selection.status = "draft"
    ctx.inspector.renderChecks()
    ctx.canvas.broadcastTokens()
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
    ctx.board = createBoard(ctx)
    // ?view=model, arena, screen or frame opens that view, so a link or a capture can
    // land on it. Otherwise the page reopens on the view this viewer last used.
    const view = new URLSearchParams(location.search).get("view") || readSaved("studio-view")
    if (VIEWS.includes(view)) store.view = view
    if (store.view === "arena" && project.variants.length < 2) store.view = "model"
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
  if (!project.variants.some((item) => item.id === selection.variant)) selection.variant = project.variants[0]?.id ?? null
  const screens = [...project.screens.map((item) => item.id), "specimen"]
  if (!screens.includes(selection.screen)) selection.screen = project.screens[0]?.id ?? "specimen"
  if (!project._sizes.some((size) => size.width === selection.width)) selection.width = project._sizes[0].width
  return before !== JSON.stringify(selection)
}

function decorate() {
  byId("screen-prev").innerHTML = icon("left")
  byId("screen-next").innerHTML = icon("right")
  byId("frame-back").innerHTML = `${icon("left", { size: 14 })}Back`
  byId("palette-prev").innerHTML = icon("left")
  byId("palette-next").innerHTML = icon("right")
  byId("comment-toggle").innerHTML = `${icon("comment")}<span>Comment</span>`
  byId("comment-toggle").setAttribute("aria-label", "Comment")
  byId("open-tab").innerHTML = `${icon("external", { size: 14 })}Open in a tab`
  byId("shortcuts-button").innerHTML = icon("keyboard")
  byId("rail-toggle").innerHTML = icon("panelLeft")
  byId("inspector-toggle").innerHTML = icon("panelRight")
  const wide = innerWidth >= 1280
  setPanel("rail", readPanel("rail", wide))
  setPanel("inspector", readPanel("inspector", true))
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
  byId("problems").innerHTML = `<strong>The studio needs fixing</strong><ul>${problems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
}

function renderRail() {
  const { project, selection } = store
  // A screen some model hasn't built yet shows how many have, such as "2/3". Complete ones show nothing.
  const screenButton = (screen, number) => {
    const total = project.variants.length
    const built = screen.id === "specimen" ? total : project.variants.filter((variant) => !(project._missing?.[variant.id] || []).includes(screen.id)).length
    return `<button type="button" class="screen-item" data-screen="${escapeHtml(screen.id)}" aria-current="${selection.screen === screen.id}">
      <span class="screen-num">${number}</span>
      <span class="screen-name">${escapeHtml(screen.label)}</span>
      ${built < total ? `<span class="screen-built" title="${built} of ${total} models built this">${built}/${total}</span>` : ""}
    </button>`
  }
  const group = (label, count) => `<h3 class="screen-group"><span>${escapeHtml(label)}</span><span class="count">${count}</span></h3>`
  let number = 0
  byId("screen-count").textContent = project.screens.length || ""
  byId("screen-options").innerHTML = project.screens.length
    ? [...screenGroups(project)].map(([role, screens]) => `${group(role || "Screens", screens.length)}${screens.map((screen) => screenButton(screen, ++number)).join("")}`).join("") +
      `${group("Design system", 1)}${screenButton({ id: "specimen", label: "Fonts and colors" }, "")}`
    : "<p class='hint'>No screens in project.json yet. Add one per view the brief names.</p>"

  const references = (project.references || []).filter((item) => !item.screens || item.screens.includes(selection.screen))
  byId("reference-count").textContent = references.length || ""
  byId("references").innerHTML = references.map((item, index) => `
    <button type="button" class="reference-thumb" data-reference="${index}" title="${escapeHtml(item.note || item.title || "")}">
      ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.app)}: ${escapeHtml(item.title || "")}" loading="lazy">` : ""}
      <span>${escapeHtml(item.app || item.title || "Reference")}</span>
    </button>`).join("") || "<p class='hint'>No references yet.</p>"
}

function renderFooter() {
  const { selection, project } = store
  const variant = ctx.currentVariant()
  const world = ctx.currentWorld()
  const approved = selection.status === "approved"
  const name = variant ? variant.model || variant.id : "a design"

  byId("revision-label").textContent = `Revision ${selection.revision}`
  const chip = byId("status-chip")
  chip.textContent = approved ? "Approved" : "Draft"
  chip.dataset.state = approved ? "approved" : "draft"
  const exported = selection.exported
  const outdated = Boolean(exported && exported.revision !== selection.revision)
  const label = byId("export-label")
  label.textContent = exported ? (outdated ? `DESIGN.md is from rev ${exported.revision}` : "DESIGN.md is current") : ""
  label.dataset.outdated = String(outdated)

  const approve = byId("approve")
  const reasons = []
  if ((project._problems || []).length) reasons.push("fix the problems listed at the top")
  if (!variant) reasons.push("no model has delivered a design yet")
  if (store.blocking) reasons.push(`${store.blocking} check${store.blocking > 1 ? "s" : ""} failing`)
  if (world && !store.fonts[world.id]) reasons.push("the font check is still running")
  approve.disabled = approved || reasons.length > 0
  const reason = byId("approve-reason")
  reason.hidden = approved || !store.blocking
  reason.innerHTML = `${icon("alert", { size: 14 })}${store.blocking} check${store.blocking > 1 ? "s" : ""} blocking`
  approve.classList.toggle("btn-done", approved)
  approve.classList.toggle("btn-primary", !approved)
  approve.innerHTML = approved ? `${icon("check", { size: 14 })}${escapeHtml(name)} approved` : `Approve ${escapeHtml(name)}`
  approve.title = `Approve ${name}'s design at revision ${selection.revision}`

  let hint = ""
  if (approved) hint = "Approved. Any change returns this to a draft."
  else hint = reasons.length ? `Can't approve yet: ${reasons.join("; ")}.` : `Approve writes DESIGN.md and design/tokens.css from ${name}'s design and colors.`
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
  const { screen, variant, width, tuning, feedback, palette, shortlist } = store.selection
  const body = { screen, variant, width, tuning, feedback, palette, shortlist }
  store.saving = store.saving.then(async () => {
    const saved = await postJson("/api/selection", body)
    for (const key of ["status", "revision", "approvedAt", "exported"]) store.selection[key] = saved[key]
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
    if (target.dataset.modelTab !== undefined) pickModel(target.dataset.modelTab)
    else if (target.classList.contains("screen-item")) showScreen(target.dataset.screen)
    else if (target.dataset.width) change({ width: Number(target.dataset.width) })
    else if (target.dataset.reference) openReference(Number(target.dataset.reference))
    else if (target.dataset.tab) ctx.inspector.setTab(target.dataset.tab)
    else if (target.hasAttribute("data-close")) target.closest("dialog")?.close()
  })

  byId("screen-select").addEventListener("change", (event) => change({ screen: event.target.value }))
  byId("screen-prev").addEventListener("click", () => stepScreen(-1))
  byId("screen-next").addEventListener("click", () => stepScreen(1))
  byId("feedback").addEventListener("input", (event) => { store.selection.feedback = event.target.value; queueSave() })
  byId("shortcuts-button").addEventListener("click", () => byId("shortcuts-dialog").showModal())
  byId("approve-reason").addEventListener("click", () => { setPanel("inspector", true); ctx.inspector.setTab("checks") })
  byId("rail-toggle").addEventListener("click", () => togglePanel("rail"))
  byId("inspector-toggle").addEventListener("click", () => togglePanel("inspector"))

  byId("approve").addEventListener("click", async () => {
    if (!await save()) return
    try {
      const saved = await postJson("/api/approve", { revision: store.selection.revision, fontChecks: store.fonts[store.selection.variant] || {} })
      for (const key of ["status", "revision", "approvedAt", "exported"]) store.selection[key] = saved[key]
      setStatus(`Approved. Wrote ${saved.exported.files.join(" and ")}`)
    } catch (error) { setStatus(error.message) }
    renderFooter()
  })

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event)) return
    const key = event.key
    const canvas = store.view !== "frame"
    if (key === "ArrowRight" || key === "ArrowLeft") { event.preventDefault(); ctx.palettes.step(key === "ArrowRight" ? 1 : -1) }
    else if (key === "s" || key === "S") ctx.palettes.toggleStar()
    else if (key === "c" || key === "C") ctx.comments.toggle()
    else if (key === "m" || key === "M") pickModel("")
    else if (key === "a" || key === "A") pickModel(store.selection.variant)
    else if (key === "j" || key === "J") stepScreen(1)
    else if (key === "k" || key === "K") stepScreen(-1)
    else if (key === "Enter" && canvas && !event.target.closest("button, a, select")) ctx.canvas.openFrame()
    else if (key === "Escape" && !canvas && !document.querySelector("dialog[open]") && byId("comment-form").hidden) ctx.canvas.back()
    else if (canvas && (key === "=" || key === "+")) ctx.board.zoomIn()
    else if (canvas && key === "-") ctx.board.zoomOut()
    else if (canvas && key === "0") ctx.board.fit()
    else if (key === "f" || key === "F") ctx.canvas.toggleFit()
    else if (key === "[") togglePanel("rail")
    else if (key === "]") togglePanel("inspector")
    else if (key === "p" || key === "P") {
      const show = document.body.classList.contains("rail-hidden") || document.body.classList.contains("inspector-hidden")
      setPanel("rail", show)
      setPanel("inspector", show)
    }
    else if (!canvas && ["1", "2", "3"].includes(key)) change({ width: store.project._sizes[Number(key) - 1].width })
    else if (key === "?") byId("shortcuts-dialog").showModal()
  })

  // Messages from any screen frame: the single screen or one on the canvas.
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return
    const frame = [...document.querySelectorAll("iframe[data-screen]")].find((item) => item.contentWindow === event.source)
    if (!frame) return
    const message = event.data || {}
    if (message.type === "ready") { ctx.canvas.broadcastTokens(); ctx.comments.frameReady(frame) }
    ctx.comments.handleMessage(message, frame)
  })
}

// A model tab shows that model's design; the empty id is Arena, every model.
function pickModel(variantId) {
  if (!variantId && store.project.variants.length < 2) return
  if (variantId) store.selection.variant = variantId
  ctx.canvas.setView(variantId ? "model" : "arena")
  change({})
}

// A screen from the rail always opens that screen from every model.
function showScreen(screenId) {
  store.view = "screen"
  change({ screen: screenId })
}

// Step through the screens in project.json order, then the specimen.
function stepScreen(step) {
  const order = [...store.project.screens.map((item) => item.id), "specimen"]
  const next = order[order.indexOf(store.selection.screen) + step]
  if (!next) return
  change({ screen: next })
  if (store.view === "model" || store.view === "arena") ctx.board.reveal()
}

function readSaved(name) {
  try { return localStorage.getItem(name) } catch { return null }
}

// Side panels are a per-viewer preference, so they live in localStorage.
// First visit below 1280 px starts with the left rail hidden, so the canvas gets the width.
function readPanel(name, fallback) {
  try {
    const stored = localStorage.getItem(`studio-${name}`)
    if (stored) return stored !== "hidden"
  } catch { /* private window: use the default */ }
  return fallback
}

function setPanel(name, show) {
  document.body.classList.toggle(`${name}-hidden`, !show)
  byId(`${name}-toggle`).setAttribute("aria-pressed", String(show))
  try { localStorage.setItem(`studio-${name}`, show ? "shown" : "hidden") } catch { /* private window: keep it for this visit */ }
  if (store.selection) ctx.canvas?.render()
}

function togglePanel(name) {
  setPanel(name, document.body.classList.contains(`${name}-hidden`))
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
