#!/usr/bin/env node
// Draws an Excalidraw-style sketch to a PNG, and writes the same drawing as a .excalidraw file beside it.
//
//   node <skill-root>/scripts/sketch.mjs <spec.json> <out.png>
//
// The spec is a small subset of the .excalidraw format: { "elements": [ ... ] }, each element one of
//   { "type": "rectangle" | "ellipse" | "diamond", "x", "y", "width", "height", "label"?, "strokeColor"?, "backgroundColor"?, "strokeStyle"? }
//   { "type": "arrow" | "line", "x", "y", "points": [[0,0],[dx,dy],...], "label"?, "strokeColor"?, "strokeStyle"? }
//   { "type": "text", "x", "y", "text", "fontSize"?, "strokeColor"?, "textAlign"? }
// Coordinates are pixels; arrow and line points are relative to their x, y, as in Excalidraw.
// "\n" in a label or text breaks the line. strokeStyle is "solid" (default), "dashed" or "dotted".
// Colours: use Excalidraw's palette, e.g. stroke #1e1e1e #e03131 #2f9e44 #1971c2 #f08c00,
// fills #ffc9c9 (red) #b2f2bb (green) #a5d8ff (blue) #ffec99 (yellow) #e9ecef (grey).
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const fail = message => {
  console.error(`sketch.mjs: ${message}`)
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
// Loaded before the usage check, so "prints its usage line" also proves the install worked.
const rough = await import('roughjs').then(m => m.default, () =>
  fail(`roughjs is not installed. Run: npm install --prefix ${here}`))

const [specFile, outPng] = process.argv.slice(2)
if (!specFile || !outPng) {
  console.error('usage: sketch.mjs <spec.json> <out.png>')
  process.exit(1)
}

let spec
try {
  spec = JSON.parse(fs.readFileSync(specFile, 'utf8'))
} catch (err) {
  fail(err.code === 'ENOENT' ? `spec file not found: ${specFile}` : `cannot read the spec ${specFile}: ${err.message}`)
}
const elements = spec?.elements ?? []
if (!Array.isArray(elements)) fail('the spec needs "elements": [ ... ], an array. See the header of this file.')

const isNum = v => typeof v === 'number' && Number.isFinite(v)
const NEEDS = {
  rectangle: ['x', 'y', 'width', 'height'], ellipse: ['x', 'y', 'width', 'height'], diamond: ['x', 'y', 'width', 'height'],
  arrow: ['x', 'y'], line: ['x', 'y'], text: ['x', 'y'],
}
elements.forEach((el, i) => {
  const needs = NEEDS[el?.type]
  if (!needs) fail(`element ${i} has type ${JSON.stringify(el?.type)}. Use one of: ${Object.keys(NEEDS).join(', ')}.`)
  const missing = needs.filter(k => !isNum(el[k]))
  if (missing.length) fail(`element ${i} (${el.type}) needs a number for: ${missing.join(', ')}.`)
  if (el.type === 'text' && el.text == null) fail(`element ${i} (text) needs "text".`)
})

const gen = rough.generator()
const FONT = 'Excalifont, Virgil, "Comic Sans MS", cursive'
// White margin around the drawing, so strokes at the edge are not cut off.
const PAD = 30
// Line height as a multiple of the font size; Excalidraw's own value for its hand-drawn font.
const LINE = 1.25

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// A fixed seed per element gives the same wobble on each run, so a re-run does not redraw every line.
// 97 is prime, so neighbouring elements get unrelated seeds.
const seedOf = (el, i) => el.seed || 1000 + i * 97
// Dash patterns close to Excalidraw's dashed and dotted strokes at stroke width 2.
const dashOf = el => (el.strokeStyle === 'dashed' ? '8 8' : el.strokeStyle === 'dotted' ? '1.5 6' : null)

// Excalidraw's defaults: roughness 1, stroke width 2, bowing 1; hachure lines 6 px apart read as a fill.
const opts = (el, i) => ({
  seed: seedOf(el, i),
  roughness: el.roughness ?? 1,
  stroke: el.strokeColor || '#1e1e1e',
  strokeWidth: el.strokeWidth || 2,
  fill: el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : undefined,
  fillStyle: el.fillStyle || 'hachure',
  fillWeight: 1,
  hachureGap: 6,
  bowing: 1,
})

const pathsSvg = (drawable, el) => {
  const dash = dashOf(el)
  // toPaths keeps the order of drawable.sets; only the outline ('path') is dashed, never the fill.
  return gen.toPaths(drawable).map((p, k) => {
    const outline = drawable.sets[k]?.type === 'path'
    return `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill || 'none'}" stroke-linecap="round" stroke-linejoin="round"${dash && outline ? ` stroke-dasharray="${dash}"` : ''}/>`
  }).join('')
}

// Rough text width, enough to size the canvas and centre labels: the hand-drawn font averages
// about 0.55 of the font size per character (11 px at size 20, as references/what-changed.md says).
const textWidth = (s, size) => Math.max(...String(s).split('\n').map(l => l.length)) * size * 0.55
const textHeight = (s, size) => String(s).split('\n').length * size * LINE

const textSvg = (s, cx, top, size, color, anchor = 'middle') =>
  String(s).split('\n').map((line, k) =>
    `<text x="${cx}" y="${top + size * (k + 0.85) * LINE}" font-family='${FONT}' font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(line)}</text>`
  ).join('')

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
const grow = (x1, y1, x2, y2) => {
  minX = Math.min(minX, x1); minY = Math.min(minY, y1)
  maxX = Math.max(maxX, x2); maxY = Math.max(maxY, y2)
}

const body = elements.map((el, i) => {
  const o = opts(el, i)
  const color = el.strokeColor || '#1e1e1e'
  const size = el.fontSize || 20
  if (el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'diamond') {
    const { x, y, width: w, height: h } = el
    grow(x, y, x + w, y + h)
    const shape =
      // Corner radius: 16 px like Excalidraw's rounded boxes, smaller on small boxes so corners never meet.
      el.type === 'rectangle' ? gen.path(roundRect(x, y, w, h, Math.min(16, w / 4, h / 4)), o)
      : el.type === 'ellipse' ? gen.ellipse(x + w / 2, y + h / 2, w, h, o)
      : gen.polygon([[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]], o)
    const label = el.label ? textSvg(el.label, x + w / 2, y + h / 2 - textHeight(el.label, size) / 2, size, color) : ''
    return pathsSvg(shape, el) + label
  }
  if (el.type === 'arrow' || el.type === 'line') {
    const pts = (el.points || [[0, 0], [100, 0]]).map(([px, py]) => [el.x + px, el.y + py])
    // 10 px around each point leaves room for the arrowhead and the stroke wobble.
    pts.forEach(([px, py]) => grow(px - 10, py - 10, px + 10, py + 10))
    let out = pathsSvg(gen.linearPath(pts, { ...o, fill: undefined }), el)
    if (el.type === 'arrow') {
      const [ax, ay] = pts[pts.length - 2], [bx, by] = pts[pts.length - 1]
      // Arrowhead: two 18 px strokes at 0.45 rad (about 26 degrees) each side, close to Excalidraw's arrow.
      const a = Math.atan2(by - ay, bx - ax), len = 18, spread = 0.45
      for (const s of [-spread, spread]) {
        const head = [[bx, by], [bx - len * Math.cos(a + s), by - len * Math.sin(a + s)]]
        out += pathsSvg(gen.linearPath(head, { ...o, fill: undefined }), { ...el, strokeStyle: 'solid' })
      }
    }
    if (el.label) {
      const mid = pts[Math.floor((pts.length - 1) / 2)], nxt = pts[Math.floor((pts.length - 1) / 2) + 1]
      const cx = (mid[0] + nxt[0]) / 2, cy = (mid[1] + nxt[1]) / 2
      const tw = textWidth(el.label, size), th = textHeight(el.label, size)
      grow(cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2)
      // A white box 4 px wider each side hides the line behind the label.
      out += `<rect x="${cx - tw / 2 - 4}" y="${cy - th / 2}" width="${tw + 8}" height="${th}" fill="#ffffff"/>` + textSvg(el.label, cx, cy - th / 2, size, color)
    }
    return out
  }
  if (el.type === 'text') {
    const tw = textWidth(el.text, size), th = textHeight(el.text, size)
    const anchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start'
    const left = anchor === 'middle' ? el.x - tw / 2 : anchor === 'end' ? el.x - tw : el.x
    grow(left, el.y, left + tw, el.y + th)
    return textSvg(el.text, el.x, el.y, size, color, anchor)
  }
  return ''
}).join('\n')

function roundRect(x, y, w, h, r) {
  return `M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`
}

if (!elements.length) grow(0, 0, 100, 100)
const vx = minX - PAD, vy = minY - PAD, vw = maxX - minX + PAD * 2, vh = maxY - minY + PAD * 2
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="${vx} ${vy} ${vw} ${vh}">
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#ffffff"/>
${body}
</svg>`

const out = path.resolve(outPng)
fs.mkdirSync(path.dirname(out), { recursive: true })
const svgFile = out.replace(/\.png$/i, '') + '.svg'
fs.writeFileSync(svgFile, svg)
let rsvgError = null
try {
  // -z 2 renders at twice the size, so the PNG stays sharp on high-density screens.
  execFileSync('rsvg-convert', ['-z', '2', '-o', out, svgFile], { stdio: ['ignore', 'ignore', 'pipe'] })
} catch (err) {
  rsvgError = err
} finally {
  fs.rmSync(svgFile, { force: true })
}
if (rsvgError) {
  fail(rsvgError.code === 'ENOENT'
    ? 'rsvg-convert not found. Install it: brew install librsvg (macOS) or apt install librsvg2-bin (Debian, Ubuntu).'
    : `rsvg-convert failed: ${String(rsvgError.stderr || rsvgError.message).trim()}`)
}

// The same drawing as a .excalidraw file, to open and edit at excalidraw.com.
let n = 0
const id = () => `el${++n}${Math.random().toString(36).slice(2, 8)}`
const base = (el, i) => ({
  id: id(), angle: 0, strokeColor: el.strokeColor || '#1e1e1e', backgroundColor: el.backgroundColor || 'transparent',
  fillStyle: el.fillStyle || 'hachure', strokeWidth: el.strokeWidth || 2, strokeStyle: el.strokeStyle || 'solid',
  roughness: el.roughness ?? 1, opacity: 100, groupIds: [], frameId: null, seed: seedOf(el, i), version: 1,
  versionNonce: seedOf(el, i) + 1, isDeleted: false, boundElements: [], updated: Date.now(), link: null, locked: false,
})
const textEl = (text, x, y, size, color, align, containerId = null) => ({
  ...base({ strokeColor: color }, 0), id: id(), type: 'text', x, y, width: textWidth(text, size), height: textHeight(text, size),
  text, originalText: text, fontSize: size, fontFamily: 5, textAlign: align, verticalAlign: containerId ? 'middle' : 'top',
  containerId, lineHeight: LINE, autoResize: true, roundness: null,
})
const xel = []
elements.forEach((el, i) => {
  const size = el.fontSize || 20
  if (el.type === 'text') {
    const align = el.textAlign || 'left'
    const tw = textWidth(el.text, size)
    xel.push(textEl(el.text, align === 'center' ? el.x - tw / 2 : align === 'right' ? el.x - tw : el.x, el.y, size, el.strokeColor || '#1e1e1e', align))
    return
  }
  const isLinear = el.type === 'arrow' || el.type === 'line'
  const pts = el.points || [[0, 0], [100, 0]]
  const shape = {
    ...base(el, i), type: el.type, x: el.x, y: el.y,
    width: isLinear ? Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0])) : el.width,
    height: isLinear ? Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1])) : el.height,
    roundness: el.type === 'rectangle' ? { type: 3 } : isLinear ? { type: 2 } : null,
    ...(isLinear ? { points: pts, startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: el.type === 'arrow' ? 'arrow' : null, lastCommittedPoint: null } : {}),
  }
  xel.push(shape)
  if (el.label) {
    const t = textEl(el.label, 0, 0, size, el.strokeColor || '#1e1e1e', 'center', shape.id)
    if (isLinear) { t.x = el.x + pts[1][0] / 2 - t.width / 2; t.y = el.y + pts[1][1] / 2 - t.height / 2 }
    else { t.x = el.x + el.width / 2 - t.width / 2; t.y = el.y + el.height / 2 - t.height / 2 }
    shape.boundElements.push({ type: 'text', id: t.id })
    xel.push(t)
  }
})
fs.writeFileSync(out.replace(/\.png$/i, '') + '.excalidraw', JSON.stringify({
  type: 'excalidraw', version: 2, source: 'https://excalidraw.com', elements: xel,
  appState: { viewBackgroundColor: '#ffffff', gridSize: null }, files: {},
}, null, 2))

console.log(out)
