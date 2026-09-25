// Pinned comments: pick an element in any screen frame (the single frame or one on
// the board), save a note, like or reject with its CSS selector, and show numbered
// pins on later visits. Each frame says which screen it shows in its data-* attributes.
import { icon } from "./icons.js"
import { byId, escapeHtml, postJson } from "./util.js"

export function createComments(ctx) {
  const { store } = ctx
  let list = []
  let mode = false
  let pending = null
  let missing = new Set()
  let focused = null
  const form = byId("comment-form")

  const commentsOn = ({ screen, variant }) => list.filter((item) => item.screen === screen && item.variant === variant)
  function visible() { return commentsOn(store.selection) }

  function frames() { return [...document.querySelectorAll("iframe[data-screen]")] }
  function send(frame, message) { frame?.contentWindow?.postMessage(message, location.origin) }
  function post(message) { send(ctx.canvas.previewFrame(), message) }

  function sendPins(only) {
    for (const frame of only ? [only] : frames()) {
      const pins = commentsOn(frame.dataset).map((item, index) => ({ id: item.id, number: index + 1, selector: item.selector, kind: item.kind, status: item.status, text: item.text }))
      send(frame, { type: "pins", pins })
    }
  }

  function setMode(on) {
    mode = on
    byId("comment-toggle").setAttribute("aria-pressed", String(on))
    byId("comment-hint").hidden = !on
    ctx.board.setCommenting(on)
    for (const frame of frames()) send(frame, { type: "comment-mode", on })
  }

  function render() {
    const items = visible()
    const open = items.filter((item) => item.status === "open").length
    byId("comment-count").textContent = open ? String(open) : ""
    byId("comment-list").innerHTML = items.map((item, index) => `
      <li data-id="${item.id}" data-status="${item.status}" class="kind-${item.kind}${focused === item.id ? " focus" : ""}">
        <div class="meta-row"><span class="num">${index + 1}</span><span>${item.kind === "note" ? "Note" : item.kind === "like" ? "Like" : "Reject"}</span><span>${escapeHtml(store.project.variants.find((variant) => variant.id === item.variant)?.model || item.variant || "")}</span><span>${item.width ?? "?"} px</span><span>revision ${item.revision}</span>${item.status === "done" ? "<span>done</span>" : ""}${missing.has(item.id) ? "<span>element not found</span>" : ""}</div>
        <div>${escapeHtml(item.text)}</div>
        <div class="snippet">On “${escapeHtml(item.snippet)}”</div>
        <div class="actions">
          <button type="button" class="btn btn-quiet btn-small" data-comment-action="show">Show</button>
          <button type="button" class="btn btn-quiet btn-small" data-comment-action="toggle">${item.status === "done" ? "Reopen" : "Mark done"}</button>
          <button type="button" class="btn btn-quiet btn-small" data-comment-action="delete">${icon("trash", { size: 13 })}Delete</button>
        </div>
      </li>`).join("") || `<li class="empty">No comments on this screen yet. Press <kbd>C</kbd> or Comment, then click the element you mean.</li>`
    sendPins()
  }

  function openForm(message, source) {
    const { variant, screen, width } = source.dataset
    pending = { selector: message.selector, snippet: message.snippet, variant, screen, width: Number(width) }
    const frame = source.getBoundingClientRect()
    const scale = frame.width / source.offsetWidth
    const rect = { x: message.rect.x * scale, y: message.rect.y * scale, height: message.rect.height * scale }
    const left = Math.min(Math.max(8, frame.left + rect.x), innerWidth - 316)
    const below = frame.top + rect.y + rect.height + 8
    const top = below + 230 > innerHeight ? Math.max(8, frame.top + rect.y - 238) : below
    Object.assign(form.style, { left: `${left}px`, top: `${top}px` })
    byId("comment-target").textContent = `On “${message.snippet}”`
    form.hidden = false
    byId("comment-text").value = ""
    byId("comment-text").focus()
  }

  function closeForm() {
    form.hidden = true
    pending = null
    setMode(false)
  }

  byId("comment-toggle").addEventListener("click", () => setMode(!mode))
  byId("comment-cancel").addEventListener("click", closeForm)
  form.addEventListener("keydown", (event) => { if (event.key === "Escape") closeForm() })
  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    if (!pending) return
    try {
      const saved = await postJson("/api/comments", { ...pending, kind: new FormData(form).get("kind"), text: byId("comment-text").value })
      list.push(saved)
      closeForm()
      // Select the screen the comment is on, so the Comments tab lists it.
      if (saved.screen !== store.selection.screen || saved.variant !== store.selection.variant) ctx.change({ screen: saved.screen, variant: saved.variant })
      focused = saved.id
      ctx.inspector.setTab("comments")
      render()
      byId("save-status").textContent = saved.kind === "note" ? "Comment saved" : "Comment saved and added to taste.md"
    } catch (error) {
      byId("comment-target").textContent = error.message
    }
  })

  byId("comment-list").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-comment-action]")
    if (!button) return
    const id = button.closest("li").dataset.id
    const item = list.find((entry) => entry.id === id)
    try {
      if (button.dataset.commentAction === "show") {
        focused = id
        ctx.change({ screen: item.screen, variant: item.variant, ...(item.width ? { width: item.width } : {}) })
        ctx.canvas.openFrame()
        // The single frame may be new; its pins arrive with frameReady, then focus the pin.
        setTimeout(() => post({ type: "focus-pin", id }), 400)
      }
      if (button.dataset.commentAction === "toggle") { item.status = item.status === "done" ? "open" : "done"; await postJson(`/api/comments/${id}`, { status: item.status }); render() }
      if (button.dataset.commentAction === "delete") { await postJson(`/api/comments/${id}/delete`, {}); list = list.filter((entry) => entry.id !== id); render() }
    } catch (error) {
      byId("save-status").textContent = error.message
    }
  })

  return {
    load(value) { list = value },
    render,
    toggle() { setMode(!mode) },
    frameReady(frame) {
      if (frame === ctx.canvas.previewFrame()) missing = new Set()
      sendPins(frame)
      if (mode) send(frame, { type: "comment-mode", on: true })
    },
    handleMessage(message, frame) {
      if (message.type === "pick") openForm(message, frame)
      if (message.type === "pick-cancel") closeForm()
      if (message.type === "pin-click") {
        const { screen, variant } = frame.dataset
        if (screen !== store.selection.screen || variant !== store.selection.variant) ctx.change({ screen, variant })
        focused = message.id
        ctx.inspector.setTab("comments")
        render()
        document.querySelector(`#comment-list li[data-id="${message.id}"]`)?.scrollIntoView({ block: "nearest" })
      }
      if (message.type === "pins-missing" && frame === ctx.canvas.previewFrame()) {
        const next = new Set(message.ids)
        if ([...next].join() !== [...missing].join()) { missing = next; render() }
      }
    },
  }
}
