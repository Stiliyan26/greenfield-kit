#!/usr/bin/env node
// Prove the built app shows the approved screens: capture each route of a running
// app at 1440 and 390, light and dark, and compare it with the PNG of the same
// screen in the design pack (design/screens/, written by export_pack.mjs).
//
//   node compare_screens.mjs --app-url http://127.0.0.1:3000 --pack design/screens --map orders=/orders,order-detail=/orders/1 [--threshold 1] [--out temp/verification/compare]
//
// --map pairs a screen id from the pack with the app route that shows it. Dark is
// the class "dark" on <html>, added before the capture. Writes <out>/<screen>__<width>__<theme>__app.png
// and compare.md; exits 1 when any pair differs by more than the threshold (percent of pixels).
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { loadPlaywright } from "./playwright.mjs"

const args = Object.fromEntries(process.argv.slice(2).map((arg, i, all) => (arg.startsWith("--") ? [arg.slice(2), all[i + 1]] : [])).filter((pair) => pair.length))
const appUrl = (args["app-url"] || "").replace(/\/$/, "")
const pack = resolve(args.pack || "design/screens")
const threshold = Number(args.threshold ?? 1)
const out = resolve(args.out || "temp/verification/compare")
const sizes = [{ width: 1440, height: 900 }, { width: 390, height: 844 }]
if (!appUrl || !args.map) { console.error("Usage: compare_screens.mjs --app-url <url> --pack design/screens --map <screen>=<route>,... [--threshold 1] [--out folder]"); process.exit(2) }
const map = args.map.split(",").map((pair) => pair.split("=")).filter((pair) => pair.length === 2)
await mkdir(out, { recursive: true })

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
const rows = []
let failed = 0
try {
  for (const [screen, route] of map) {
    for (const size of sizes) {
      for (const theme of ["light", "dark"]) {
        const reference = join(pack, `${screen}__${size.width}__${theme}.png`)
        if (!existsSync(reference)) { rows.push(`| ${screen} | ${size.width} | ${theme} | - | no ${reference} | DIFFERS |`); failed++; continue }
        const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
        await page.goto(appUrl + route, { waitUntil: "load" })
        if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"))
        await settle(page)
        const appShot = join(out, `${screen}__${size.width}__${theme}__app.png`)
        await page.screenshot({ path: appShot, fullPage: true })
        const diff = await compare(page, reference, appShot)
        const ok = diff.percent <= threshold && diff.sameSize
        if (!ok) failed++
        rows.push(`| ${screen} | ${size.width} | ${theme} | ${diff.percent.toFixed(2)}% | ${diff.sameSize ? "" : `size ${diff.a} vs ${diff.b}`} | ${ok ? "ok" : "DIFFERS"} |`)
        console.log(`${ok ? "✓" : "✗"} ${screen} ${size.width} ${theme}: ${diff.percent.toFixed(2)}% differ${diff.sameSize ? "" : ` (size ${diff.a} vs ${diff.b})`}`)
        await page.close()
      }
    }
  }
} finally {
  await browser.close()
}
const report = ["# Built app vs approved screens", "", `App ${appUrl} · pack ${pack} · threshold ${threshold}%`, "", "| Screen | Width | Theme | Pixels differ | Note | Result |", "| --- | --- | --- | --- | --- | --- |", ...rows, ""]
await writeFile(join(out, "compare.md"), report.join("\n"))
console.log(`${rows.length - failed} of ${rows.length} captures match within ${threshold}%. Report: ${join(out, "compare.md")}`)
process.exit(failed ? 1 : 0)

// Fonts load only once text uses them, and document.fonts.ready can resolve before
// that starts; wait until no face is still loading, then let layout settle.
async function settle(page) {
  await page.evaluate(async () => {
    for (let i = 0; i < 50; i++) {
      await document.fonts.ready
      if (![...document.fonts].some((face) => face.status === "loading")) break
      await new Promise((done) => setTimeout(done, 100))
    }
  })
  await page.waitForTimeout(300)
}

// Pixel difference between two PNGs, computed in the browser so no image library is needed.
async function compare(page, a, b) {
  const [pngA, pngB] = await Promise.all([readFile(a), readFile(b)])
  return page.evaluate(async ([dataA, dataB]) => {
    const load = (data) => new Promise((done) => { const img = new Image(); img.onload = () => done(img); img.src = `data:image/png;base64,${data}` })
    const [imgA, imgB] = await Promise.all([load(dataA), load(dataB)])
    const sameSize = imgA.width === imgB.width && imgA.height === imgB.height
    const width = Math.min(imgA.width, imgB.width)
    const height = Math.min(imgA.height, imgB.height)
    const read = (img) => { const c = document.createElement("canvas"); c.width = width; c.height = height; const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0); return ctx.getImageData(0, 0, width, height).data }
    const pa = read(imgA), pb = read(imgB)
    let differ = 0
    for (let i = 0; i < pa.length; i += 4) {
      if (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]) > 24) differ++
    }
    return { percent: (differ / (width * height)) * 100, sameSize, a: `${imgA.width}×${imgA.height}`, b: `${imgB.width}×${imgB.height}` }
  }, [pngA.toString("base64"), pngB.toString("base64")])
}
