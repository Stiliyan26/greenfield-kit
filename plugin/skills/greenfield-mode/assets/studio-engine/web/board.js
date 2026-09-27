// The canvas of exact-size frames. Three layouts share it:
//   model  - one model's screens: a boxed row per size (desktop, laptop, phone)
//   arena  - a row per model; in each row the three size boxes side by side
//   screen - one screen from every model: models across, a boxed row per size
// Drag or scroll to pan, Ctrl-scroll or pinch to zoom. Frames load only near the view.
import { byId, escapeHtml } from "./util.js"

const MIN_ZOOM = 0.015
const MAX_ZOOM = 2
const PAD = 48

export function createBoard(ctx) {
  const { store } = ctx
  const board = byId("board")
  const world = byId("board-world")
  let key = ""
  let placeKey = ""
  let view = { x: PAD, y: PAD, z: 0.2 }
  let drag = null
  let mountTimer = null
  let boardRect = null
  let wheelZoom = null

  // --- drawing ---------------------------------------------------------------

  function render() {
    const { project, selection } = store
    const mode = store.view
    const next = JSON.stringify([mode, mode === "model" ? selection.variant : null, mode === "screen" ? selection.screen : null,
      project.variants.map((item) => [item.id, item.model]), project.screens, project._missing])
    if (next !== key) {
      key = next
      world.replaceChildren(...draw(mode))
      // Start again at the top left only when a different canvas opens.
      const place = JSON.stringify([mode, mode === "model" ? selection.variant : mode === "screen" ? selection.screen : null])
      if (place !== placeKey) { placeKey = place; requestAnimationFrame(start) }
      scheduleMount()
    }
    world.querySelectorAll(".board-item").forEach((item) => {
      item.setAttribute("aria-current", String(item.dataset.variant === selection.variant && item.dataset.screen === selection.screen))
    })
  }

  function draw(mode) {
    const { variants, screens, _sizes: sizes } = store.project
    if (!variants.length) return [note("No variants yet. Each model writes studio/candidates/<id>/variant.json and one file per screen.")]
    if (mode === "arena") {
      return variants.map((variant) => {
        const row = section("board-row", heading("board-row-label", variant.model || variant.id, variant.summary))
        const groups = document.createElement("div")
        groups.className = "board-groups"
        groups.append(...sizes.map((size) => group(size, screens.map((screen) => item(variant, screen, size, screen.label, screen.role)))))
        row.append(groups)
        return row
      })
    }
    if (mode === "screen") {
      const screen = screens.find((entry) => entry.id === store.selection.screen) || { id: "specimen", label: "Specimen" }
      const title = heading("board-title", screen.label, [screen.role, screen.requirement].filter(Boolean).join(" · "))
      // The specimen is one page per look, so it shows at the laptop size only.
      const rows = screen.id === "specimen" ? [sizes[1]] : sizes
      return [title, ...rows.map((size) => group(size, variants.map((variant) => item(variant, screen, size, variant.model || variant.id, ""))))]
    }
    const variant = variants.find((entry) => entry.id === store.selection.variant) || variants[0]
    return [heading("board-title", variant.model || variant.id, variant.summary),
      ...sizes.map((size) => group(size, screens.map((screen) => item(variant, screen, size, screen.label, screen.role))))]
  }

  // Reading layout (getBoundingClientRect etc.) forces the browser to flush any
  // style change made since the last paint. Every zoom tick changes --zoom, and a
  // lot of CSS below sizes itself off --zoom, so a naive read-every-tick zoom
  // handler forces a full board layout on every wheel event. Cache the rect and
  // only drop it when the board actually moves or resizes.
  function getBoardRect() {
    if (!boardRect) boardRect = board.getBoundingClientRect()
    return boardRect
  }

  function note(text) { return Object.assign(document.createElement("p"), { className: "board-empty", textContent: text }) }

  function section(className, ...children) {
    const element = document.createElement("section")
    element.className = className
    element.append(...children)
    return element
  }

  function heading(className, title, detail) {
    const element = document.createElement("h2")
    element.className = className
    element.innerHTML = `<strong>${escapeHtml(title)}</strong>${detail ? `<span>${escapeHtml(detail)}</span>` : ""}`
    return element
  }

  // A box of frames at one size, labelled with the size.
  function group(size, items) {
    const box = section("board-group", heading("board-group-label", size.label, `${size.width} × ${size.height}`))
    const strip = document.createElement("div")
    strip.className = "board-strip"
    strip.append(...items)
    box.append(strip)
    return box
  }

  function item(variant, screen, size, title, detail) {
    const element = document.createElement("div")
    element.className = "board-item"
    Object.assign(element.dataset, { variant: variant.id, screen: screen.id, width: String(size.width) })
    element.style.width = `${size.width}px`
    element.innerHTML = `<div class="board-label"><strong>${escapeHtml(title)}</strong>${detail ? `<span>${escapeHtml(detail)}</span>` : ""}</div>`
    const box = document.createElement("div")
    box.className = "board-frame"
    box.style.height = `${size.height}px`
    const src = ctx.canvas.frameSrc(variant.id, screen.id)
    if (src) {
      box.dataset.src = src
      box.innerHTML = `<button type="button" class="board-open" data-board-open title="Open this screen alone (Enter)">Open</button>`
    } else {
      box.classList.add("missing")
      box.textContent = "Not built yet"
    }
    element.append(box)
    return element
  }

  // Frames load only near the visible area and unload far from it, so an arena of
  // three models × three sizes × every screen stays light.
  function scheduleMount() {
    clearTimeout(mountTimer)
    mountTimer = setTimeout(mountNear, 120)
  }

  function mountNear() {
    if (board.hidden) return
    const area = board.getBoundingClientRect()
    const near = (rect, margin) => rect.right > area.left - area.width * margin && rect.left < area.right + area.width * margin &&
      rect.bottom > area.top - area.height * margin && rect.top < area.bottom + area.height * margin
    for (const box of world.querySelectorAll(".board-frame[data-src]")) {
      const frame = box.querySelector("iframe")
      const rect = box.getBoundingClientRect()
      if (!frame && near(rect, 0.5)) box.append(makeFrame(box))
      else if (frame && !near(rect, 2)) frame.remove()
    }
  }

  function makeFrame(box) {
    const { variant, screen, width } = box.parentElement.dataset
    const frame = document.createElement("iframe")
    frame.title = `${screen} by ${variant} at ${width} px`
    frame.src = box.dataset.src
    frame.tabIndex = -1
    // Comments read which screen a frame shows from these.
    Object.assign(frame.dataset, { variant, screen, world: variant, width })
    frame.style.width = `${width}px`
    frame.style.height = box.style.height
    return frame
  }

  // --- pan and zoom ----------------------------------------------------------

  // Moving the canvas is split in two. Each frame only moves the world as one
  // layer (cheap, like moving a picture). When the gesture stops, the zoom-sized
  // labels and borders are recomputed and nearby frames load: those touch every
  // frame on the board, so doing them per wheel event is what made zoom lag.
  let frameQueued = false
  let settleTimer = 0
  let settledZoom = null

  function apply() {
    if (!frameQueued) {
      frameQueued = true
      requestAnimationFrame(() => { frameQueued = false; paintView() })
    }
    board.classList.add("board-moving")
    clearTimeout(settleTimer)
    settleTimer = setTimeout(settle, 140)
  }

  function paintView() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.z})`
    // Keep the dots at least 12 px apart at any zoom, so they never turn into noise.
    let dots = 24 * view.z
    while (dots < 12) dots *= 4
    board.style.backgroundSize = `${dots}px ${dots}px`
    board.style.backgroundPosition = `${view.x}px ${view.y}px`
    byId("zoom-level").textContent = `${Math.round(view.z * 100)}%`
  }

  // Fit and reveal measure right after moving, so they apply at once.
  function applyNow() {
    clearTimeout(settleTimer)
    paintView()
    settle()
  }

  function settle() {
    board.classList.remove("board-moving")
    if (settledZoom !== view.z) {
      settledZoom = view.z
      board.style.setProperty("--zoom", String(view.z))
    }
    scheduleMount()
  }

  // A wheel or pinch zooms as a gesture; a button or key is one step and lands at once.
  function zoomAt(z, cx = board.clientWidth / 2, cy = board.clientHeight / 2, gesture = false) {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
    view = { x: cx - ((cx - view.x) * next) / view.z, y: cy - ((cy - view.y) * next) / view.z, z: next }
    if (gesture) apply()
    else applyNow()
  }

  // Top left, zoomed so a desktop frame takes about 40% of the width. The screen
  // comparison is small enough to fit whole.
  function start() {
    if (!board.clientWidth) return
    if (store.view === "screen") { fit(); return }
    view = { x: PAD, y: PAD, z: Math.min(1, Math.max(0.08, (board.clientWidth * 0.4) / store.project._sizes[0].width)) }
    applyNow()
  }

  // Labels keep their screen size, so the canvas size depends on the zoom: measure twice.
  function fit() {
    for (let pass = 0; pass < 2; pass += 1) {
      const width = world.offsetWidth
      const height = world.offsetHeight
      if (!width || !height || !board.clientWidth) return
      const z = Math.min(1, Math.max(MIN_ZOOM, Math.min((board.clientWidth - PAD * 2) / width, (board.clientHeight - PAD * 2) / height)))
      const x = width * z < board.clientWidth - PAD * 2 ? (board.clientWidth - width * z) / 2 : PAD
      view = { x, y: PAD, z }
      applyNow()
    }
  }

  // Bring the selected screen into view, keeping the zoom.
  function reveal() {
    const target = world.querySelector(".board-item[aria-current=true]")
    if (!target) return
    paintView()
    const box = target.getBoundingClientRect()
    const frame = board.getBoundingClientRect()
    view.x += frame.left + frame.width / 2 - (box.left + box.width / 2)
    view.y += frame.top + PAD * 2 - box.top
    applyNow()
  }

  board.addEventListener("wheel", (event) => {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) {
      const frame = board.getBoundingClientRect()
      zoomAt(view.z * Math.exp(-event.deltaY * 0.01), event.clientX - frame.left, event.clientY - frame.top, true)
    } else {
      view.x -= event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX
      view.y -= event.shiftKey && !event.deltaX ? 0 : event.deltaY
      apply()
    }
  }, { passive: false })

  board.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button")) return
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: { ...view }, moved: false }
  })
  board.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (!drag.moved && Math.hypot(dx, dy) < 4) return
    if (!drag.moved) { drag.moved = true; board.setPointerCapture(event.pointerId); board.classList.add("panning") }
    view = { ...drag.start, x: drag.start.x + dx, y: drag.start.y + dy }
    apply()
  })
  board.addEventListener("pointerup", (event) => {
    if (!drag || drag.id !== event.pointerId) return
    const clicked = !drag.moved
    drag = null
    board.classList.remove("panning")
    const target = clicked && event.target.closest?.(".board-item")
    if (target) select(target)
  })
  board.addEventListener("pointercancel", () => { drag = null; board.classList.remove("panning") })
  board.addEventListener("dblclick", (event) => {
    const target = event.target.closest(".board-item")
    if (target) open(target)
  })
  board.addEventListener("click", (event) => {
    const button = event.target.closest("[data-board-open]")
    if (button) open(button.closest(".board-item"))
  })

  function select(target) {
    ctx.change({ variant: target.dataset.variant, screen: target.dataset.screen })
  }

  function open(target) {
    ctx.change({ variant: target.dataset.variant, screen: target.dataset.screen, width: Number(target.dataset.width) })
    ctx.canvas.openFrame()
  }

  byId("zoom-in").addEventListener("click", () => zoomAt(view.z * 1.25))
  byId("zoom-out").addEventListener("click", () => zoomAt(view.z / 1.25))
  byId("zoom-level").addEventListener("click", () => zoomAt(1))
  byId("zoom-fit").addEventListener("click", fit)
  new ResizeObserver(scheduleMount).observe(board)
  apply()

  return {
    render, fit, reveal,
    zoomIn: () => zoomAt(view.z * 1.25),
    zoomOut: () => zoomAt(view.z / 1.25),
    setCommenting(on) { board.classList.toggle("commenting", on) },
  }
}
