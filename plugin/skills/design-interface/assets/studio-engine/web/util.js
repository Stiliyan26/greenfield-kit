export const byId = (id) => document.getElementById(id)

export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
)[character])

export async function getJson(url, options) {
  const response = await fetch(url, options)
  const value = await response.json()
  if (!response.ok) throw new Error(value.error || `${url} answered ${response.status}`)
  return value
}

export function postJson(url, body) {
  return getJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
}

export function isTyping(event) {
  const target = event.target
  return target.closest?.("input, textarea, select, [contenteditable=true]") || document.querySelector("dialog[open]")
}
