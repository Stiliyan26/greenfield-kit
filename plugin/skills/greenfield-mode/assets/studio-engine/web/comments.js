// Pinned comments: pick an element in the frame, save a note, like or reject with
// its CSS selector, and show numbered pins on later visits.
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

  function visible() {
    const { screen, layout, world } = store.selection
    return list.filter((item) => item.screen === screen && (screen === "specimen" ? item.world === world : item.layout === layout))
  }

  function post(message) { ctx.canvas.previewFrame()?.contentWindow?.postMessage(message, location.origin) }

  function sendPins() {
    post({ type: "pins", pins: visible().map((item, index) => ({ id: item.id, number: index + 1, selector: item.selector, kind: item.kind, status: item.status, text: item.text })) })
  }

  function setMode(on) {
    if (on && store.view !== "frame") ctx.canvas.setView("frame")
    mode = on
    byId("comment-toggle").setAttribute("aria-pressed", String(on))
    byId("comment-hint").hidden = !on
    post({ type: "comment-mode", on })
  }

  function render() {
    const items = visible()
    const open = items.filter((item) => item.status === "open").length
    byId("comment-count").textContent = open ? String(open) : ""
    byId("comment-list").innerHTML = items.map((item, index) => `
      <li data-id="${item.id}" data-status="${item.status}" class="kind-${item.kind}${focused === item.id ? " focus" : ""}">
        <div class="meta-row"><span class="num">${index + 1}</span><span>${item.kind === "note" ? "Note" : item.kind === "like" ? "Like" : "Reject"}</span><span>${escapeHtml(item.world)}</span><span>${item.width ?? "?"} px</span><span>revision ${item.revision}</span>${item.status === "done" ? "<span>done</span>" : ""}${missing.has(item.id) ? "<span>element not found</span>" : ""}</div>
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

  function openForm(message) {
    pending = { selector: message.selector, snippet: message.snippet }
    const frame = ctx.canvas.previewFrame().getBoundingClientRect()
    const scale = ctx.canvas.previewScale()
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
    const { layout, world, screen, width } = store.selection
    try {
      const saved = await postJson("/api/comments", { ...pending, kind: new FormData(form).get("kind"), text: byId("comment-text").value, layout: screen === "specimen" ? "" : layout, world, screen, width })
      list.push(saved)
      closeForm()
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
      if (button.dataset.commentAction === "show") { focused = id; render(); ctx.canvas.setView("frame"); post({ type: "focus-pin", id }) }
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
    frameReady() { missing = new Set(); sendPins(); if (mode) post({ type: "comment-mode", on: true }) },
    handleMessage(message) {
      if (message.type === "pick") openForm(message)
      if (message.type === "pick-cancel") closeForm()
      if (message.type === "pin-click") {
        focused = message.id
        ctx.inspector.setTab("comments")
        render()
        document.querySelector(`#comment-list li[data-id="${message.id}"]`)?.scrollIntoView({ block: "nearest" })
      }
      if (message.type === "pins-missing") {
        const next = new Set(message.ids)
        if ([...next].join() !== [...missing].join()) { missing = next; render() }
      }
    },
  }
}
