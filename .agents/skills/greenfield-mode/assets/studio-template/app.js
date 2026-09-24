let project
let state
let saveTimer
let saveQueue = Promise.resolve()
let phone = false
let feedbackDirty = false

const byId = (id) => document.getElementById(id)
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character])

function colors() {
  const offsets = state.harmony === "triadic" ? [120, 240]
    : state.harmony === "complementary" ? [180, 205] : [-28, 28]
  return [state.hue, state.hue + offsets[0], state.hue + offsets[1]].map(
    (hue) => `hsl(${((hue % 360) + 360) % 360} 58% 42%)`
  )
}

function applyTheme(frame) {
  try {
    const root = frame.contentDocument?.documentElement
    if (!root) return
    const [main, second, third] = colors()
    root.style.setProperty("--gf-primary", main)
    root.style.setProperty("--gf-secondary", second)
    root.style.setProperty("--gf-tertiary", third)
    const font = project.fonts.find((item) => item.id === state.font)
    root.style.setProperty("--gf-font-family", font?.family || "system-ui, sans-serif")
  } catch {
    byId("save-status").textContent = "Candidate preview must be served from this studio"
  }
}

function renderFrame(path, className) {
  const frame = document.createElement("iframe")
  frame.className = className
  frame.title = "Design candidate preview"
  frame.loading = "lazy"
  frame.src = path
  frame.addEventListener("load", () => applyTheme(frame))
  return frame
}

function ready() {
  return project.concepts.length >= 2 && project.concepts.length <= 3
    && project.screens.length > 0
    && project.concepts.every((concept) => project.screens.every(
      (screen) => Boolean(concept.previews?.[screen.id])
    ))
}

function render() {
  byId("product-name").textContent = project.name
  document.title = `${project.name} · Design studio`
  byId("concept-options").innerHTML = project.concepts.length ? project.concepts.map(
    (concept) => `<button type="button" data-concept="${escapeHtml(concept.id)}" aria-pressed="${state.concept === concept.id}"><strong>${escapeHtml(concept.name)}</strong><small>${escapeHtml(concept.summary)}</small></button>`
  ).join("") : "<p>Add two or three candidate designs to studio/project.json.</p>"

  const comparison = byId("comparison")
  comparison.replaceChildren()
  if (!ready()) {
    const pending = document.createElement("div")
    pending.className = "pending"
    pending.textContent = "Designs are not ready yet. The agent must add two or three real candidates with the same representative screens before review."
    comparison.append(pending)
  } else {
    for (const concept of project.concepts) {
      const card = document.createElement("div")
      card.className = `concept-card ${state.concept === concept.id ? "selected" : ""}`
      const thumbnail = document.createElement("div")
      thumbnail.className = "thumbnail"
      thumbnail.append(renderFrame(concept.previews[state.screen], "compare-frame"))
      const button = document.createElement("button")
      button.type = "button"
      button.dataset.concept = concept.id
      button.setAttribute("aria-pressed", String(state.concept === concept.id))
      button.innerHTML = `<strong>${escapeHtml(concept.name)}</strong><small>${escapeHtml(concept.summary)}</small>`
      card.append(thumbnail, button)
      comparison.append(card)
    }
  }

  byId("screen-options").innerHTML = project.screens.map((screen) =>
    `<button type="button" role="tab" data-screen="${escapeHtml(screen.id)}" aria-selected="${state.screen === screen.id}">${escapeHtml(screen.label)}</button>`
  ).join("")
  const selected = project.concepts.find((concept) => concept.id === state.concept)
  byId("preview-title").textContent = selected?.name || "Preview"
  byId("preview-description").textContent = selected?.summary || "Candidates will appear here when ready."
  const preview = byId("preview")
  preview.replaceChildren()
  if (ready() && selected) preview.append(renderFrame(selected.previews[state.screen], "full-frame"))
  byId("preview-shell").classList.toggle("phone", phone)
  byId("phone-button").setAttribute("aria-pressed", String(phone))
  byId("phone-button").textContent = phone ? "Desktop view" : "Phone view"

  byId("font").innerHTML = project.fonts.map((font) =>
    `<option value="${escapeHtml(font.id)}">${escapeHtml(font.name)}</option>`
  ).join("")
  byId("font").value = state.font
  byId("hue").value = String(state.hue)
  byId("hue-label").textContent = `${state.hue}°`
  byId("harmony").value = state.harmony
  byId("swatches").innerHTML = colors().map((color) => `<span style="background:${color}"></span>`).join("")
  byId("revision-label").textContent = `Revision ${String(state.revision).padStart(2, "0")} · ${state.status === "approved" ? "Approved" : "Draft"}`
  byId("approve-button").disabled = !ready() || state.status === "approved"
  byId("approve-button").textContent = state.status === "approved" ? "Revision approved ✓" : "Approve this revision"
}

function change(next, designChange = true) {
  if (Object.entries(next).every(([key, value]) => state[key] === value)) return
  state = { ...state, ...next }
  if (designChange) state = { ...state, status: "draft", approvedAt: null, revision: state.revision + 1 }
  render()
  queueSave()
}

function queueSave(immediate = false) {
  clearTimeout(saveTimer)
  byId("save-status").textContent = "Unsaved changes"
  if (immediate) return save()
  saveTimer = setTimeout(save, 400)
}

function save() {
  clearTimeout(saveTimer)
  const snapshot = { ...state }
  saveQueue = saveQueue.then(async () => {
    const response = await fetch("/api/selection", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    })
    if (!response.ok) throw new Error((await response.json()).error || "Save failed")
    byId("save-status").textContent = JSON.stringify(snapshot) === JSON.stringify(state)
      ? "Saved locally in studio/selection.json" : "Saving newer changes…"
    return true
  }).catch((error) => {
    byId("save-status").textContent = error.message
    return false
  })
  return saveQueue
}

function listen() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button")
    if (button?.dataset.concept) change({ concept: button.dataset.concept })
    if (button?.dataset.screen) change({ screen: button.dataset.screen }, false)
  })
  byId("hue").addEventListener("input", (event) => {
    state = { ...state, hue: Number(event.target.value), status: "draft", approvedAt: null }
    byId("hue-label").textContent = `${state.hue}°`
    byId("swatches").innerHTML = colors().map((color) => `<span style="background:${color}"></span>`).join("")
    document.querySelectorAll("iframe").forEach(applyTheme)
  })
  byId("hue").addEventListener("change", () => {
    state.revision += 1
    render()
    queueSave()
  })
  byId("harmony").addEventListener("change", (event) => change({ harmony: event.target.value }))
  byId("font").addEventListener("change", (event) => change({ font: event.target.value }))
  byId("phone-button").addEventListener("click", () => { phone = !phone; render() })
  byId("feedback").addEventListener("input", (event) => {
    state = { ...state, feedback: event.target.value, status: "draft", approvedAt: null,
      revision: state.revision + (feedbackDirty ? 0 : 1) }
    feedbackDirty = true
    byId("revision-label").textContent = `Revision ${String(state.revision).padStart(2, "0")} · Draft`
    byId("approve-button").disabled = !ready()
    byId("approve-button").textContent = "Approve this revision"
    queueSave()
  })
  byId("feedback").addEventListener("blur", () => { feedbackDirty = false })
  byId("save-button").addEventListener("click", () => queueSave(true))
  byId("approve-button").addEventListener("click", async () => {
    if (!ready()) return
    state = { ...state, status: "approved", approvedAt: new Date().toISOString() }
    render()
    if (!await queueSave(true) && state.status === "approved") {
      state = { ...state, status: "draft", approvedAt: null }
      render()
    }
  })
}

async function start() {
  try {
    const [projectResponse, selectionResponse] = await Promise.all([
      fetch("/api/project"), fetch("/api/selection"),
    ])
    if (!projectResponse.ok || !selectionResponse.ok) throw new Error("Cannot load studio data")
    project = await projectResponse.json()
    state = await selectionResponse.json()
    const conceptChanged = !project.concepts.some((item) => item.id === state.concept)
    const screenChanged = !project.screens.some((item) => item.id === state.screen)
    if (conceptChanged) state.concept = project.concepts[0]?.id || null
    if (screenChanged) state.screen = project.screens[0]?.id || null
    if ((conceptChanged || screenChanged) && state.status === "approved") {
      state.status = "draft"
      state.approvedAt = null
      state.revision += 1
    }
    if (!project.fonts.some((item) => item.id === state.font)) state.font = project.fonts[0]?.id || "humanist"
    byId("feedback").value = state.feedback
    byId("save-status").textContent = "Saved locally in studio/selection.json"
    render()
    listen()
    if (state.concept && state.screen) queueSave(true)
  } catch (error) {
    byId("save-status").textContent = error.message
  }
}

start()
