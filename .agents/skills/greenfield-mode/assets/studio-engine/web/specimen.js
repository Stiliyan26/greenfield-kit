// Fills the specimen with the project's sample text, font names and live color roles.
import { onColor, tonalScale, toHex } from "./color.js"
import { icon } from "./icons.js"

const DEFAULT_SAMPLE = {
  display: "The quick brown fox",
  body: "Body text should stay easy to read in long paragraphs and in tight table cells.",
  label: "Label · 12 items",
  search: "Search",
  rows: [["09:00", "First item", "ok"], ["11:30", "Second item", "warning"], ["14:00", "Third item", "danger"]],
}
const ROLES = [["Primary", "color-primary"], ["Secondary", "color-secondary"], ["Tertiary", "color-tertiary"], ["Neutral", "color-bg"]]

const project = await fetch("/api/project").then((response) => response.json())
const worldId = new URLSearchParams(location.search).get("world") || project.worlds[0]?.id
const world = project.worlds.find((item) => item.id === worldId) || project.worlds[0]
const sample = { ...DEFAULT_SAMPLE, ...(project.specimen || {}) }
const meaning = project.statusMeaning || {}
const family = (stack) => String(stack || "").split(",")[0].trim().replace(/^["']|["']$/g, "")
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character])

document.querySelectorAll("[data-font]").forEach((element) => { element.textContent = family(world?.fonts?.[element.dataset.font]) })
document.querySelectorAll("[data-sample]").forEach((element) => { element.textContent = sample[element.dataset.sample] ?? "" })
document.querySelectorAll("[data-icon]").forEach((element) => element.insertAdjacentHTML("afterbegin", icon(element.dataset.icon, { size: 20 })))
document.querySelectorAll("[data-icon-before]").forEach((element) => element.insertAdjacentHTML("afterbegin", icon(element.dataset.iconBefore, { size: 18 })))
document.getElementById("alerts").innerHTML = ["danger", "warning", "ok"].map((name) =>
  `<div class="alert ${name}">${name[0].toUpperCase()}${name.slice(1)}<span>${escape(meaning[name] ?? "No meaning recorded in project.json")}</span></div>`).join("")
document.getElementById("rows").innerHTML = sample.rows.map(([time, item, state], index) =>
  `<tr class="${index === 1 ? "selected" : ""}"><td class="num">${escape(time)}</td><td>${escape(item)}</td><td><span class="pill ${escape(state)}">${escape(state)}</span></td></tr>`).join("")

function paint() {
  const style = getComputedStyle(document.documentElement)
  if (!style.getPropertyValue("--color-bg").trim()) return
  document.getElementById("roles").innerHTML = ROLES.map(([label, token]) => {
    const hex = toHex(style.getPropertyValue(`--${token}`).trim())
    const tones = tonalScale(hex).map((tone) => `<span style="background:${tone.hex}" title="${label} ${tone.step}: ${tone.hex}"></span>`).join("")
    return `<div class="role"><div class="role-fill" style="background:${hex};color:${onColor(hex)}"><span>${label}</span><code>${hex.toUpperCase()}</code></div><div class="tones">${tones}</div></div>`
  }).join("")
}

paint()
new MutationObserver(paint).observe(document.getElementById("studio-tokens"), { childList: true, characterData: true, subtree: true })
