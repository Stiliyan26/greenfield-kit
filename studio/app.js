import { concepts, renderScreen } from "./designs.js"

const defaults = {
  concept: "route", font: "commissioner", harmony: "analogous", screen: "calendar",
  hue: 205, density: "comfortable", status: "draft", revision: 1,
  feedback: "", approvedAt: null,
}
const names = { calendar: "Calendar", booking: "Booking", animator: "Animator" }
const fonts = [
  { id: "source", name: "Humanist", sample: "Вълшебен рожден ден", note: "Source Sans 3 / clear" },
  { id: "geist", name: "Geometric", sample: "Вълшебен рожден ден", note: "Manrope / confident" },
  { id: "georgia", name: "Editorial", sample: "Вълшебен рожден ден", note: "Literata / warm" },
  { id: "commissioner", name: "Run sheet", sample: "Вълшебен рожден ден", note: "Commissioner / plain" },
  { id: "plex", name: "Office", sample: "Вълшебен рожден ден", note: "IBM Plex Sans / grid" },
  { id: "sofia", name: "Sofia", sample: "Вълшебен рожден ден", note: "Sofia Sans / local" },
]
let state = { ...defaults }
let saveTimer
let saveQueue = Promise.resolve()
let phone = false
let feedbackDirty = false

const byId = (id) => document.getElementById(id)

function color(hue, saturation = 60, lightness = 42) {
  return `hsl(${((hue % 360) + 360) % 360} ${saturation}% ${lightness}%)`
}

function palette(hue, harmony, concept) {
  const offsets = harmony === "triadic" ? [120, 240] : harmony === "complementary" ? [180, 205] : [-28, 28]
  const lightness = concept === "fieldbook" ? 68 : 40
  const saturation = concept === "fieldbook" ? 68 : 63
  return {
    main: color(hue, saturation, lightness),
    second: color(hue + offsets[0], 54, concept === "fieldbook" ? 65 : 48),
    third: color(hue + offsets[1], 45, concept === "fieldbook" ? 70 : 54),
    pale: color(hue, 40, concept === "fieldbook" ? 19 : 94),
  }
}

function contrastInk(hue, concept) {
  if (concept === "fieldbook") return "#142825"
  const x = (1 - Math.abs(2 * .40 - 1)) * .63
  const r = colorChannel(hue, x, .40, 0)
  const g = colorChannel(hue, x, .40, 8)
  const b = colorChannel(hue, x, .40, 4)
  const luminance = .2126 * channel(r) + .7152 * channel(g) + .0722 * channel(b)
  return (1.05 / (luminance + .05)) >= 4.5 ? "#fff" : "#152222"
}

function colorChannel(hue, chroma, lightness, offset) {
  const k = (offset + hue / 30) % 12
  return lightness - chroma / 2 * Math.max(-1, Math.min(k - 3, 9 - k, 1))
}

function channel(value) {
  return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4
}

function styleTokens(settings, concept = settings.concept) {
  const colors = palette(settings.hue, settings.harmony, concept)
  return `--brand:${colors.main};--brand-ink:${contrastInk(settings.hue, concept)};--brand-two:${colors.second};--brand-three:${colors.third};--brand-pale:${colors.pale};`
}

function hueName(hue) {
  if (hue < 18 || hue >= 345) return "Coral"
  if (hue < 48) return "Amber"
  if (hue < 72) return "Gold"
  if (hue < 145) return "Green"
  if (hue < 195) return "Teal"
  if (hue < 260) return "Blue"
  if (hue < 320) return "Violet"
  return "Rose"
}

function conceptCard(concept) {
  const chosen = state.concept === concept.id
  const example = { ...defaults, concept: concept.id, hue: concept.defaultHue }
  return `<div class="concept-card ${chosen ? "is-selected" : ""}">
    <div class="concept-mini" aria-hidden="true" inert><div class="preview-app ${concept.id} comfortable font-${state.font}" style="${styleTokens(example, concept.id)}">${renderScreen(concept.id, "calendar")}</div></div>
    <button class="concept-caption" data-concept="${concept.id}" type="button" aria-pressed="${chosen}"><span class="concept-letter">${concept.number}</span><span><strong>${concept.name}</strong><small>${concept.note}</small></span><span class="concept-check">${chosen ? "Selected" : "Explore ↗"}</span></button>
  </div>`
}

function render() {
  const chosen = concepts.find((concept) => concept.id === state.concept)
  byId("concept-list").innerHTML = concepts.map((concept) =>
    `<button class="concept-option ${state.concept === concept.id ? "is-active" : ""}" type="button" data-concept="${concept.id}" aria-pressed="${state.concept === concept.id}"><span>${concept.number}</span><div><strong>${concept.name}</strong><small>${concept.note}</small></div></button>`
  ).join("")
  byId("comparison").innerHTML = concepts.map(conceptCard).join("")
  byId("preview-title").textContent = chosen.name
  byId("preview-description").textContent = chosen.note
  byId("screen-tabs").innerHTML = Object.entries(names).map(([id, label]) =>
    `<button type="button" role="tab" data-screen="${id}" aria-selected="${state.screen === id}" class="${state.screen === id ? "is-active" : ""}">${label}</button>`
  ).join("")
  byId("preview").innerHTML = `<div class="preview-app ${state.concept} ${state.density} font-${state.font}" style="${styleTokens(state)}">${renderScreen(state.concept, state.screen)}</div>`
  byId("preview-shell").classList.toggle("is-phone", phone)
  byId("viewport-button").setAttribute("aria-pressed", String(phone))
  byId("viewport-button").textContent = phone ? "Desktop view" : "Phone view"
  byId("hue").value = String(state.hue)
  byId("hue-output").textContent = `${state.hue}°`
  byId("hue-value").textContent = `${state.hue}°`
  byId("hue-name").textContent = hueName(state.hue)
  byId("color-wheel").style.setProperty("--picked-color", color(state.hue))
  byId("harmony-options").innerHTML = ["analogous", "complementary", "triadic"].map((id) =>
    `<button type="button" data-harmony="${id}" aria-pressed="${state.harmony === id}" class="${state.harmony === id ? "is-active" : ""}">${id[0].toUpperCase()}${id.slice(1)}</button>`
  ).join("")
  const colors = palette(state.hue, state.harmony, state.concept)
  byId("swatches").innerHTML = Object.entries(colors).map(([name, value]) => `<div><span style="background:${value}"></span><small>${name}</small></div>`).join("")
  byId("palette-description").textContent = `${hueName(state.hue)} · ${state.harmony} harmony`
  byId("font-options").innerHTML = fonts.map((font) =>
    `<button type="button" data-font="${font.id}" aria-pressed="${state.font === font.id}" class="font-option font-${font.id} ${state.font === font.id ? "is-active" : ""}"><span>${font.sample}</span><small>${font.name} <i>·</i> ${font.note}</small></button>`
  ).join("")
  byId("density-options").innerHTML = ["comfortable", "compact"].map((id) =>
    `<button type="button" data-density="${id}" aria-pressed="${state.density === id}" class="${state.density === id ? "is-active" : ""}">${id === "comfortable" ? "Comfortable" : "Compact"}</button>`
  ).join("")
  byId("revision-label").textContent = `Revision ${String(state.revision).padStart(2, "0")} · ${state.status === "approved" ? "Approved" : "Draft"}`
  byId("approve-button").textContent = state.status === "approved" ? "Revision approved ✓" : "Approve this revision"
  byId("approve-button").disabled = state.status === "approved"
}

function change(next) {
  const changed = Object.entries(next).some(([key, value]) => state[key] !== value)
  if (!changed) return
  state = { ...state, ...next, status: "draft", approvedAt: null, revision: state.revision + 1 }
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
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    const response = await fetch("/api/selection", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    })
    if (!response.ok) throw new Error((await response.json()).error || "Save failed")
    byId("save-status").textContent = JSON.stringify(snapshot) === JSON.stringify(state)
      ? "Saved in studio/selection.json" : "Saving newer changes…"
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
    if (!button) return
    if (button.dataset.concept) {
      const concept = concepts.find((item) => item.id === button.dataset.concept)
      change({ concept: concept.id, hue: concept.defaultHue, font: concept.defaultFont })
    } else if (button.dataset.screen) {
      if (state.screen === button.dataset.screen) return
      state = { ...state, screen: button.dataset.screen }
      render()
      queueSave()
    }
    else if (button.dataset.harmony) change({ harmony: button.dataset.harmony })
    else if (button.dataset.font) change({ font: button.dataset.font })
    else if (button.dataset.density) change({ density: button.dataset.density })
  })
  byId("hue").addEventListener("input", (event) => {
    state = { ...state, hue: Number(event.target.value), status: "draft", approvedAt: null }
    render()
  })
  byId("hue").addEventListener("change", () => {
    state = { ...state, revision: state.revision + 1 }
    render()
    queueSave()
  })
  byId("color-wheel").addEventListener("click", (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left - bounds.width / 2
    const y = event.clientY - bounds.top - bounds.height / 2
    const angle = (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360
    change({ hue: Math.round(angle) })
  })
  byId("viewport-button").addEventListener("click", () => { phone = !phone; render() })
  byId("feedback").addEventListener("input", (event) => {
    state = { ...state, feedback: event.target.value, status: "draft", approvedAt: null,
      revision: state.revision + (feedbackDirty ? 0 : 1) }
    feedbackDirty = true
    queueSave()
    byId("revision-label").textContent = `Revision ${String(state.revision).padStart(2, "0")} · Draft`
    byId("approve-button").disabled = false
    byId("approve-button").textContent = "Approve this revision"
  })
  byId("feedback").addEventListener("blur", () => { feedbackDirty = false })
  byId("save-button").addEventListener("click", () => queueSave(true))
  byId("approve-button").addEventListener("click", async () => {
    state = { ...state, status: "approved", approvedAt: new Date().toISOString() }
    render()
    const saved = await queueSave(true)
    if (!saved && state.status === "approved") {
      state = { ...state, status: "draft", approvedAt: null }
      render()
    }
  })
}

async function start() {
  try {
    const response = await fetch("/api/selection")
    if (!response.ok) throw new Error("Cannot load selection")
    state = { ...defaults, ...(await response.json()) }
    byId("save-status").textContent = "Saved in studio/selection.json"
  } catch {
    byId("save-status").textContent = "Run python3 studio/server.py to save"
  }
  byId("feedback").value = state.feedback
  render()
  listen()
}

start()
