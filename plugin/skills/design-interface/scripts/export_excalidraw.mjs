// Export an .excalidraw file to PNG (2x) and SVG with Excalidraw's own renderer,
// run in headless Chromium. Needs the network once: the renderer comes from esm.sh.
//   node export_excalidraw.mjs <file.excalidraw> <out-prefix>
// writes <out-prefix>.png and <out-prefix>.svg.
import { readFileSync, writeFileSync } from "node:fs"
import { loadPlaywright } from "./playwright.mjs"

const [input, out] = process.argv.slice(2)
if (!input || !out) {
  console.error("usage: node export_excalidraw.mjs <file.excalidraw> <out-prefix>")
  process.exit(2)
}
const scene = JSON.parse(readFileSync(input, "utf8"))
const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent("<html><body></body></html>")
const result = await page.evaluate(async (scene) => {
  const lib = await import("https://esm.sh/@excalidraw/excalidraw@0.18.0?deps=react@19.0.0,react-dom@19.0.0")
  const restored = lib.restore(scene, null, null)
  const args = {
    elements: restored.elements,
    appState: { ...restored.appState, exportBackground: true, viewBackgroundColor: "#ffffff" },
    files: scene.files || {},
  }
  const svg = (await lib.exportToSvg(args)).outerHTML
  const blob = await lib.exportToBlob({ ...args, mimeType: "image/png", getDimensions: (w, h) => ({ width: w * 2, height: h * 2, scale: 2 }) })
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let bin = ""
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return { svg, png: btoa(bin) }
}, scene)
await browser.close()
writeFileSync(`${out}.svg`, result.svg)
writeFileSync(`${out}.png`, Buffer.from(result.png, "base64"))
console.log(`wrote ${out}.png ${out}.svg`)
