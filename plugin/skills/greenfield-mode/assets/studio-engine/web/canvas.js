// The canvas: one frame at its true width, or an overview of every layout × world.
import { byId, escapeHtml } from "./util.js"

const WIDTHS = [1440, 1024, 390]
const THUMB_WIDTH = 1440

export function createCanvas(ctx) {
  const { store } = ctx
  let gridKey = ""
  let previewKey = ""
  let frameHeight = 900
  store.fit = readFit()

  const thumbObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const frame = entry.target.querySelector("iframe")
      if (frame) frame.style.transform = `scale(${entry.contentRect.width / THUMB_WIDTH})`
    }
  })

  byId("view-frame").addEventListener("click", () => setView("frame"))
  byId("view-grid").addEventListener("click", () => setView("grid"))
  byId("zoom-toggle").addEventListener("click", toggleFit)
  new ResizeObserver(sizePreview).observe(byId("canvas"))

  function frameSrc(layoutId, worldId) {
    const world = encodeURIComponent(worldId)
    if (store.selection.screen === "specimen") return `/_studio/specimen.html?world=${world}`
    const layout = store.project.layouts.find((item) => item.id === layoutId)
    return `${layout.previews[store.selection.screen]}?world=${world}`
  }

  function previewFrame() { return byId("frame-holder").querySelector("iframe") }

  function previewScale() {
    const available = byId("canvas").clientWidth - 56
    return store.fit ? Math.min(1, available / store.selection.width) : 1
  }

  function render() {
    const { project, selection } = store
    byId("screen-tabs").innerHTML = [...project.screens, { id: "specimen", label: "Specimen" }].map((screen) =>
      `<button type="button" role="tab" data-screen="${screen.id}" aria-selected="${selection.screen === screen.id}">${screen.label}</button>`).join("")
    byId("width-options").innerHTML = WIDTHS.map((width) => `<button type="button" data-width="${width}" aria-pressed="${selection.width === width}">${width}</button>`).join("")
    byId("view-frame").setAttribute("aria-pressed", String(store.view === "frame"))
    byId("view-grid").setAttribute("aria-pressed", String(store.view === "grid"))
    byId("grid").hidden = store.view !== "grid"
    byId("stage").hidden = store.view !== "frame"
    renderGrid()
    renderPreview()
  }

  function renderGrid() {
    const { project, selection } = store
    const specimen = selection.screen === "specimen"
    const layouts = specimen ? [null] : project.layouts
    const key = JSON.stringify([selection.screen, layouts.map((item) => item?.id), project.worlds.map((item) => item.id)])
    if (key !== gridKey) {
      gridKey = key
      // Put the longer list across, so a layout round with one world is one row.
      const layoutsAcross = layouts.length > project.worlds.length
      const columns = layoutsAcross ? layouts : project.worlds
      const rows = layoutsAcross ? project.worlds : layouts
      const grid = byId("grid")
      grid.style.gridTemplateColumns = `18px repeat(${columns.length || 1}, minmax(0, 1fr))`
      grid.replaceChildren(document.createElement("span"))
      for (const column of columns) grid.append(Object.assign(document.createElement("span"), { className: "col-head", textContent: column?.name ?? "Specimen" }))
      for (const row of rows) {
        grid.append(Object.assign(document.createElement("span"), { className: "row-head", textContent: row?.name ?? "Specimen" }))
        for (const column of columns) grid.append(layoutsAcross ? cell(column, row) : cell(row, column))
      }
    }
    byId("grid").querySelectorAll(".cell").forEach((item) => {
      const layoutMatches = !item.dataset.layout || item.dataset.layout === selection.layout
      item.setAttribute("aria-pressed", String(layoutMatches && item.dataset.world === selection.world))
    })
  }

  function cell(layout, world) {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "cell"
    if (layout) button.dataset.layout = layout.id
    button.dataset.world = world.id
    const thumb = document.createElement("span")
    thumb.className = "thumb"
    const frame = document.createElement("iframe")
    frame.loading = "lazy"
    frame.tabIndex = -1
    frame.title = `${layout?.name ?? "Specimen"} in ${world.name}`
    frame.src = frameSrc(layout?.id, world.id)
    thumb.append(frame)
    thumbObserver.observe(thumb)
    button.setAttribute("aria-label", `${layout ? `${layout.name} in ` : "Specimen in "}${world.name}`)
    button.append(thumb)
    return button
  }

  function renderPreview() {
    const { selection, project } = store
    const layout = ctx.currentLayout()
    const world = ctx.currentWorld()
    if (!world || (!layout && selection.screen !== "specimen")) return
    const src = frameSrc(layout?.id, world.id)
    const screen = selection.screen === "specimen" ? "Specimen" : project.screens.find((item) => item.id === selection.screen)?.label
    const lead = selection.screen === "specimen" ? `<strong>Specimen</strong> of ${escapeHtml(world.name)}` : `<strong>${escapeHtml(layout.name)}</strong> in ${escapeHtml(world.name)}`
    byId("preview-title").innerHTML = `${lead}, ${escapeHtml(screen)}, ${selection.width} px`
    byId("open-tab").href = src
    const key = `${src}|${selection.width}`
    if (key !== previewKey) {
      previewKey = key
      frameHeight = 900
      const frame = document.createElement("iframe")
      frame.title = "Candidate at its true width"
      frame.src = src
      byId("frame-holder").replaceChildren(frame)
    }
    sizePreview()
  }

  function sizePreview() {
    const frame = previewFrame()
    if (!frame) return
    const scale = previewScale()
    frame.style.width = `${store.selection.width}px`
    frame.style.height = `${frameHeight}px`
    frame.style.transform = scale === 1 ? "" : `scale(${scale})`
    const holder = byId("frame-holder")
    holder.style.width = `${Math.floor(store.selection.width * scale)}px`
    holder.style.height = `${Math.ceil(frameHeight * scale)}px`
    byId("preview-title").parentElement.style.width = holder.style.width
    const toggle = byId("zoom-toggle")
    toggle.setAttribute("aria-pressed", String(store.fit))
    toggle.textContent = store.fit ? `Fit ${Math.round(scale * 100)}%` : "100%"
  }

  function broadcastTokens() {
    const world = ctx.currentWorld()
    if (!world) return
    const message = { type: "tokens", world: world.id, tokens: ctx.currentTokens() }
    document.querySelectorAll("iframe").forEach((frame) => frame.contentWindow?.postMessage(message, location.origin))
  }

  function setView(view) {
    store.view = view
    render()
    if (view === "grid") broadcastTokens()
  }

  function toggleFit() {
    store.fit = !store.fit
    try { localStorage.setItem("studio-fit", String(store.fit)) } catch { /* private window: keep it in memory */ }
    sizePreview()
  }

  return {
    render, broadcastTokens, previewFrame, previewScale, setView, toggleFit,
    setFrameHeight(height) { frameHeight = Math.max(400, height); sizePreview() },
  }
}

function readFit() {
  try { return localStorage.getItem("studio-fit") !== "false" } catch { return true }
}
