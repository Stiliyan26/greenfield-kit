// Prove a promoted app shows the approved screens: capture every route of the app
// and the same screen in the studio at 1920, 1440 and 390, light and dark, and
// report the share of pixels that differ.
//
//   node compare_screens.mjs --app <web folder> --studio-url http://127.0.0.1:4173 --variant <id> [--threshold 1] [--out temp/verification/promote]
//
// The app is served with `vite preview` from its dist/. The studio must be running.
// Writes <out>/<screen>__<width>__<theme>__{app,studio}.png and compare.md; exits 1
// when any pair differs by more than the threshold (percent of pixels).
import { spawn } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { loadPlaywright } from "./playwright.mjs"

const args = Object.fromEntries(process.argv.slice(2).map((arg, i, all) => (arg.startsWith("--") ? [arg.slice(2), all[i + 1]] : [])).filter((pair) => pair.length))
const app = resolve(args.app || "web")
const studioUrl = (args["studio-url"] || "http://127.0.0.1:4173").replace(/\/$/, "")
const variant = args.variant
const threshold = Number(args.threshold ?? 1)
const out = resolve(args.out || "temp/verification/promote")
const sizes = [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 390, height: 844 }]
if (!variant) { console.error("--variant is required"); process.exit(2) }

const project = await (await fetch(`${studioUrl}/api/project`)).json()
const screens = project.screens.map((screen) => screen.id)
await mkdir(out, { recursive: true })

const port = 4300 + Math.floor(Math.random() * 500)
const preview = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: app, stdio: "ignore" })
const appUrl = `http://127.0.0.1:${port}`
await waitFor(appUrl)

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
const rows = []
let failed = 0
try {
  for (const screen of screens) {
    for (const size of sizes) {
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
        const dark = theme === "dark" ? "&theme=dark" : ""
        await page.goto(`${studioUrl}/candidates/${variant}/${screen}.html?world=${variant}${dark}`)
        await page.locator("html[data-studio-ready=true]").waitFor()
        await settle(page)
        const studioShot = join(out, `${screen}__${size.width}__${theme}__studio.png`)
        await page.screenshot({ path: studioShot, fullPage: true })
        await page.goto(`${appUrl}/${screen}?theme=${theme}`)
        await settle(page)
        const appShot = join(out, `${screen}__${size.width}__${theme}__app.png`)
        await page.screenshot({ path: appShot, fullPage: true })
        const diff = await compare(page, studioShot, appShot)
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
  preview.kill()
}
const report = ["# Promoted app vs studio", "", `Variant ${variant} · threshold ${threshold}% · app ${app}`, "", "| Screen | Width | Theme | Pixels differ | Note | Result |", "| --- | --- | --- | --- | --- | --- |", ...rows, ""]
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

async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try { await fetch(url); return } catch { await new Promise((done) => setTimeout(done, 200)) }
  }
  throw new Error(`${url} did not start`)
}

export const here = fileURLToPath(import.meta.url)
