// Checks that gate approval. The rules come from the server (/api/project _rules),
// which runs the same contrast and hue checks again before it writes any file.
import { contrast, hueDistance, inGamut, mix, onColor, parse } from "./color.js"

export function effectiveTokens(project, world, tuning) {
  const tokens = deriveExtended({ ...world.tokens, ...(tuning?.[world.id] || {}) })
  for (const [name, value] of Object.entries(project.status || {})) tokens[`status-${name}`] = value
  return tokens
}

// Fill palette tokens a world doesn't set. Twin of derive_extended in studio_export.py.
export function deriveExtended(tokens) {
  const set = (name, make) => { if (!(name in tokens)) tokens[name] = make() }
  set("color-secondary", () => tokens["color-primary"])
  set("color-tertiary", () => tokens["color-accent"])
  set("color-on-secondary", () => onColor(tokens["color-secondary"]))
  set("color-on-tertiary", () => onColor(tokens["color-tertiary"]))
  set("color-primary-soft", () => mix(tokens["color-primary"], tokens["color-surface"], 0.14))
  set("color-secondary-soft", () => mix(tokens["color-secondary"], tokens["color-surface"], 0.14))
  set("color-tertiary-soft", () => mix(tokens["color-tertiary"], tokens["color-surface"], 0.16))
  set("color-surface-2", () => mix(tokens["color-ink"], tokens["color-surface"], 0.05))
  return tokens
}

export function runChecks(project, tokens) {
  const results = []
  for (const [foreground, background, minimum, label] of project._rules.contrastPairs) {
    if (!(foreground in tokens) || !(background in tokens)) continue
    const ratio = contrast(tokens[foreground], tokens[background])
    results.push({ id: `${foreground}/${background}`, kind: "contrast", label, ratio, minimum, pass: ratio >= minimum - 0.005 })
  }
  const { degrees, chroma: minimumChroma } = project._rules.hueGuard
  const danger = parse(tokens["status-danger"])
  for (const name of ["color-primary", "color-secondary", "color-accent"]) {
    if (!(name in tokens)) continue
    const [, chroma, hue] = parse(tokens[name])
    const distance = hueDistance(hue, danger[2])
    results.push({ id: `${name}/hue`, kind: "hue", label: `${name.replace("color-", "")} stays clear of the danger red`, distance, pass: !(chroma >= minimumChroma && distance < degrees) })
  }
  for (const [name, value] of Object.entries(tokens)) {
    if (/^(color|status)-/.test(name) && !inGamut(parse(value))) {
      results.push({ id: `${name}/gamut`, kind: "gamut", label: `${name} is outside sRGB and will be clipped`, pass: true, warning: true })
    }
  }
  return results
}

const fontCache = new Map()

export function familyName(stack) {
  return String(stack).split(",")[0].trim().replace(/^["']|["']$/g, "")
}

// Ask Google Fonts which subsets each family ships. Returns
// { family: "ok" | "missing cyrillic" | "not checked: …" }.
export async function checkFonts(world, scripts) {
  const results = {}
  const families = [...new Set([familyName(world.fonts.display), familyName(world.fonts.body)])]
  if (!world.fonts.google) {
    for (const family of families) results[family] = "not checked: no Google Fonts query"
    return results
  }
  const url = `https://fonts.googleapis.com/css2?${world.fonts.google}&display=swap`
  if (!fontCache.has(url)) {
    fontCache.set(url, fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Google Fonts answered ${response.status}`)
      return response.text()
    }))
  }
  let css
  try {
    css = await fontCache.get(url)
  } catch (error) {
    fontCache.delete(url)
    for (const family of families) results[family] = `not checked: ${error.message}`
    return results
  }
  const subsets = new Map()
  for (const match of css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*{[^}]*?font-family:\s*'([^']+)'/g)) {
    if (!subsets.has(match[2])) subsets.set(match[2], new Set())
    subsets.get(match[2]).add(match[1])
  }
  for (const family of families) {
    const found = subsets.get(family)
    if (!found) { results[family] = "missing: not in the Google Fonts query"; continue }
    const missing = (scripts || []).filter((script) => !found.has(script))
    results[family] = missing.length ? `missing ${missing.join(", ")}` : "ok"
  }
  return results
}
