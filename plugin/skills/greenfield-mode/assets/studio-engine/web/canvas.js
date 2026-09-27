// The canvas area: tabs (one per model, then Arena), the frame canvas (board.js) for
// the model, arena and screen views, and one screen alone at an exact size.
import { effectiveTokens } from "./checks.js"
import { byId, escapeHtml } from "./util.js"

export const VIEWS = ["model", "arena", "screen", "frame"]

// Screens grouped by role, in project.json order. A screen without a role goes in the "" group.
export function screenGroups(project) {
  const groups = new Map()
  for (const screen of project.screens) {
    const role = screen.role || ""
    if (!groups.has(role)) groups.set(role, [])
    groups.get(role).push(screen)
  }
  return groups
}

export function createCanvas(ctx) {
  const { store } = ctx
  let previewKey = ""
  store.fit = readFit()
  store.back = "model"

  byId("zoom-toggle").addEventListener("click", toggleFit)
  byId("frame-back").addEventListener("click", back)
  new ResizeObserver(sizePreview).observe(byId("canvas"))

  // A screen's address, or null when that variant has no file for it yet.
  function frameSrc(variantId, screenId) {
    const world = encodeURIComponent(variantId)
    const theme = store.theme === "dark" ? "&theme=dark" : ""
    if (screenId === "specimen") return `/_studio/specimen.html?world=${world}${theme}`
    if ((store.project._missing?.[variantId] || []).includes(screenId)) return null
    return `/candidates/${encodeURIComponent(variantId)}/${encodeURIComponent(screenId)}.html?world=${world}${theme}`
  }

  function sizes() { return store.project._sizes || [] }
  function currentSize() { return sizes().find((size) => size.width === store.selection.width) || sizes()[0] }
  function previewFrame() { return byId("frame-holder").querySelector("iframe") }

  // Fit shows the whole frame, width and height, like a real screen seen from further away.
  function previewScale() {
    const size = currentSize()
    if (!store.fit || !size) return 1
    const canvas = byId("canvas")
    return Math.min(1, (canvas.clientWidth - 56) / size.width, (canvas.clientHeight - 96) / size.height)
  }

  function render() {
    const { project, selection } = store
    try { localStorage.setItem("studio-view", store.view) } catch { /* private window: forget it */ }
    renderTabs()
    // The components view replaces the canvas for the selected model, screen and size.
    const components = Boolean(store.components)
    const frame = store.view === "frame" && !components
    byId("board").hidden = frame || components
    byId("stage").hidden = !frame
    byId("component-map").hidden = !components
    byId("zoom-controls").hidden = frame || components
    byId("frame-back").hidden = !frame
    byId("zoom-toggle").hidden = components
    for (const id of ["screen-stepper", "width-group"]) byId(id).hidden = !frame && !components
    const option = (screen) => `<option value="${escapeHtml(screen.id)}"${selection.screen === screen.id ? " selected" : ""}>${escapeHtml(screen.label)}</option>`
    byId("screen-select").innerHTML = [...screenGroups(project)].map(([role, screens]) =>
      role ? `<optgroup label="${escapeHtml(role)}">${screens.map(option).join("")}</optgroup>` : screens.map(option).join("")).join("") +
      option({ id: "specimen", label: "Specimen" })
    byId("width-options").innerHTML = sizes().map((size) => `<button type="button" data-width="${size.width}" aria-pressed="${selection.width === size.width}" title="${escapeHtml(size.label)} ${size.width} × ${size.height}">${size.width}</button>`).join("")
    byId("view-title").textContent = components ? "Components" : viewTitle()
    ctx.componentMap.render()
    if (components) return
    if (frame) renderPreview()
    else ctx.board.render()
  }

  function viewTitle() {
    const screen = store.project.screens.find((item) => item.id === store.selection.screen)
    if (store.view === "arena") return "Every model, every screen"
    if (store.view === "screen") return `${screen?.label ?? "Specimen"} from every model`
    if (store.view === "model") return "Every screen at three sizes"
    return ""
  }

  // One tab per model's design, then Arena when there is more than one.
  function renderTabs() {
    const { variants } = store.project
    const tabs = variants.map((variant) => `
      <button type="button" role="tab" data-model-tab="${escapeHtml(variant.id)}" aria-selected="${store.view === "model" && store.selection.variant === variant.id}" title="${escapeHtml(variant.summary || "")}">
        <strong>${escapeHtml(variant.model || variant.id)}</strong><span>${escapeHtml(variant.world.name || "")}</span>
      </button>`).join("")
    const arena = variants.length > 1 ? `<button type="button" role="tab" data-model-tab="" class="arena-tab" aria-selected="${store.view === "arena"}"><strong>Arena</strong><span>all ${variants.length} models</span></button>` : ""
    byId("model-tabs").innerHTML = tabs + arena || "<p class='hint'>No model has delivered a variant yet.</p>"
  }

  function renderPreview() {
    const { selection, project } = store
    const variant = ctx.currentVariant()
    const size = currentSize()
    if (!variant || !size) return
    const src = frameSrc(variant.id, selection.screen)
    const specimen = selection.screen === "specimen"
    const screen = project.screens.find((item) => item.id === selection.screen)
    byId("preview-title").innerHTML = `<strong>${escapeHtml(specimen ? "Specimen" : screen?.label ?? selection.screen)}</strong> by ${escapeHtml(variant.model || variant.id)}, ${escapeHtml(size.label)} ${size.width} × ${size.height}`
    byId("preview-need").textContent = specimen || !screen ? "" : [screen.role, screen.requirement].filter(Boolean).join(" · ")
    byId("open-tab").hidden = !src
    if (src) byId("open-tab").href = src
    const key = `${src}|${size.width}`
    if (key !== previewKey) {
      previewKey = key
      const holder = byId("frame-holder")
      if (!src) {
        holder.replaceChildren(Object.assign(document.createElement("p"), { className: "frame-missing", textContent: `${variant.model || variant.id} has no ${screen?.label ?? selection.screen} screen yet.` }))
        holder.style.width = holder.style.height = ""
        return
      }
      const frame = document.createElement("iframe")
      frame.title = "Screen at its exact size"
      frame.src = src
      // Comments read which screen a frame shows from these.
      Object.assign(frame.dataset, { variant: variant.id, screen: selection.screen, world: variant.id, width: String(size.width) })
      holder.replaceChildren(frame)
    }
    sizePreview()
  }

  function sizePreview() {
    const frame = previewFrame()
    const size = currentSize()
    if (!frame || !size || store.view !== "frame") return
    const scale = previewScale()
    frame.style.width = `${size.width}px`
    frame.style.height = `${size.height}px`
    frame.style.transform = scale === 1 ? "" : `scale(${scale})`
    const holder = byId("frame-holder")
    holder.style.width = `${Math.floor(size.width * scale)}px`
    holder.style.height = `${Math.ceil(size.height * scale)}px`
    byId("preview-title").parentElement.style.width = holder.style.width
    byId("preview-need").style.width = holder.style.width
    const toggle = byId("zoom-toggle")
    toggle.setAttribute("aria-pressed", String(store.fit))
    toggle.textContent = store.fit ? `Fit ${Math.round(scale * 100)}%` : "100%"
  }

  // Send a model's current tokens to its frames (default: the selected model).
  function broadcastTokens(world = ctx.currentWorld()) {
    if (!world) return
    const theme = store.theme === "dark" && world.dark ? "dark" : "light"
    const message = { type: "tokens", world: world.id, theme, tokens: effectiveTokens(store.project, world, store.selection.tuning, theme) }
    document.querySelectorAll("iframe").forEach((frame) => frame.contentWindow?.postMessage(message, location.origin))
  }

  function setView(view) {
    const next = VIEWS.includes(view) ? view : "model"
    // The components view shows one model's screen; Arena and one screen alone replace it.
    if (store.components && (next === "arena" || next === "frame")) ctx.componentMap.close()
    if (next === "frame" && store.view !== "frame") store.back = store.view
    store.view = next
    render()
  }

  function openFrame() { setView("frame") }
  function back() { setView(store.back === "frame" ? "model" : store.back) }

  function toggleFit() {
    store.fit = !store.fit
    try { localStorage.setItem("studio-fit", String(store.fit)) } catch { /* private window: keep it in memory */ }
    sizePreview()
  }

  return { render, broadcastTokens, frameSrc, previewFrame, previewScale, setView, openFrame, back, toggleFit }
}

function readFit() {
  try { return localStorage.getItem("studio-fit") !== "false" } catch { return true }
}
