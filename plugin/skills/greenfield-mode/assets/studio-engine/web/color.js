// Hex and OKLCH parsing, conversion, and WCAG 2 contrast.
// The Python twin is ../studio_color.py. Keep the two in step.

const OKLCH = /^oklch\(\s*([0-9.]+)(%?)\s+([0-9.]+)\s+([0-9.]+)(?:deg)?\s*\)$/
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function parse(value) {
  const text = String(value).trim()
  let match = OKLCH.exec(text)
  if (match) return [Number(match[1]) / (match[2] ? 100 : 1), Number(match[3]), ((Number(match[4]) % 360) + 360) % 360]
  match = HEX.exec(text)
  if (match) {
    let digits = match[1]
    if (digits.length === 3) digits = [...digits].map((character) => character + character).join("")
    return srgbToOklch([0, 2, 4].map((index) => parseInt(digits.slice(index, index + 2), 16) / 255))
  }
  throw new Error(`Use #rrggbb or oklch(L C H) without alpha, not ${value}`)
}

export function format([lightness, chroma, hue]) {
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`
}

export function toLinear([lightness, chroma, hue]) {
  const a = chroma * Math.cos((hue * Math.PI) / 180)
  const b = chroma * Math.sin((hue * Math.PI) / 180)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function srgbToOklch(channels) {
  const [red, green, blue] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [lightness, Math.hypot(a, b), (((Math.atan2(b, a) * 180) / Math.PI) % 360 + 360) % 360]
}

export function inGamut(lch) {
  return toLinear(lch).every((channel) => channel >= -0.0005 && channel <= 1.0005)
}

function luminance(lch) {
  const [red, green, blue] = toLinear(lch).map((channel) => Math.min(1, Math.max(0, channel)))
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrast(first, second) {
  const [lighter, darker] = [luminance(parse(first)), luminance(parse(second))].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

export function toHex(value) {
  return "#" + toLinear(parse(value)).map((channel) => {
    const c = Math.min(1, Math.max(0, channel))
    const encoded = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
    return Math.round(encoded * 255).toString(16).padStart(2, "0")
  }).join("")
}

export function hueDistance(first, second) {
  const difference = Math.abs(first - second) % 360
  return Math.min(difference, 360 - difference)
}

// --- palettes: tonal scales and role mapping (twin of studio_color.py / studio_export.py) ---

export const TONES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
export const WHITE = "oklch(1.000 0.000 0.0)"

export function fit([lightness, chroma, hue]) {
  if (inGamut([lightness, chroma, hue])) return [lightness, chroma, hue]
  let low = 0
  let high = chroma
  for (let step = 0; step < 18; step += 1) {
    const middle = (low + high) / 2
    if (inGamut([lightness, middle, hue])) low = middle
    else high = middle
  }
  return [lightness, low, hue]
}

export function tone(seed, lightness) {
  const [, chroma, hue] = parse(seed)
  const taper = Math.max(0.15, 1 - Math.abs((lightness - 0.55) / 0.45) ** 3 * 0.85)
  return format(fit([lightness, chroma * taper, hue]))
}

export function tonalScale(seed) {
  return TONES.map((step) => ({ step, hex: toHex(tone(seed, step / 100)) }))
}

export function mix(first, second, amount) {
  const lab = (value) => { const [l, c, h] = parse(value); return [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)] }
  const a = lab(first)
  const b = lab(second)
  const [l, x, y] = [0, 1, 2].map((index) => a[index] * amount + b[index] * (1 - amount))
  return format([l, Math.hypot(x, y), (((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360) % 360])
}

export function onColor(value) {
  return contrast(WHITE, value) >= 4.5 ? WHITE : tone(value, 0.16)
}

function darkenUntil(value, against, minimum) {
  let [lightness, chroma, hue] = parse(value)
  while (contrast(format([lightness, chroma, hue]), against) < minimum && lightness > 0.05) {
    [lightness, chroma, hue] = fit([lightness - 0.01, chroma, hue])
  }
  return format([lightness, chroma, hue])
}

function roleColor(seed, surface) {
  let value = darkenUntil(format(parse(seed)), surface, 3)
  if (contrast(onColor(value), value) < 4.5) value = darkenUntil(value, WHITE, 4.5)
  return value
}

// Four seeds -> the studio's color tokens.
export function paletteTokens(seeds) {
  const [, neutralChroma, neutralHue] = parse(seeds.neutral)
  const grey = (lightness) => format(fit([lightness, Math.min(neutralChroma, 0.035), neutralHue]))
  const tokens = {
    "color-bg": grey(0.965), "color-surface": grey(0.992), "color-surface-2": grey(0.935),
    "color-line": grey(0.87), "color-muted": grey(0.47), "color-ink": grey(0.21),
  }
  for (const role of ["primary", "secondary", "tertiary"]) {
    const value = roleColor(seeds[role], tokens["color-surface"])
    tokens[`color-${role}`] = value
    tokens[`color-on-${role}`] = onColor(value)
    tokens[`color-${role}-soft`] = tone(value, 0.93)
  }
  tokens["color-accent"] = tokens["color-tertiary"]
  return tokens
}
