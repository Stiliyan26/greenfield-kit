#!/usr/bin/env node
// Screenshot every screen × variant × size of a running design studio (the sizes are
// 1920×1080, 1440×900 and 390×844), plus each variant's specimen, and record
// mechanical problems for the design critic. Screenshots are the full page.
//
//   node <greenfield-mode>/scripts/capture.mjs --url http://127.0.0.1:4173 --out temp/verification/<run>
//     [--sizes desktop,laptop,phone] [--variants a,b] [--screens s] [--studio]
//
// Playwright is found by ./playwright.mjs.
import { mkdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { loadPlaywright } from "./playwright.mjs"

const args = parseArgs(process.argv.slice(2))
if (!args.url || !args.out) {
  console.error("Usage: capture.mjs --url <studio url> --out <folder> [--sizes desktop,laptop,phone] [--variants ids] [--screens ids] [--studio]")
  process.exit(2)
}
const base = args.url.replace(/\/$/, "")
const out = resolve(args.out)
const pick = (value) => (value ? new Set(value.split(",")) : null)

const project = await fetch(`${base}/api/project`).then((response) => response.json())
const sizes = project._sizes.filter((item) => !pick(args.sizes) || pick(args.sizes).has(item.id))
const variants = project.variants.filter((item) => !pick(args.variants) || pick(args.variants).has(item.id))
const screens = [...project.screens.map((item) => item.id), "specimen"].filter((id) => !pick(args.screens) || pick(args.screens).has(id))

const jobs = []
const skipped = []
for (const screen of screens) {
  for (const variant of variants) {
    const specimen = screen === "specimen"
    if (!specimen && project._missing?.[variant.id]?.includes(screen)) { skipped.push(`${variant.id}/${screen}`); continue }
    const path = specimen ? `/_studio/specimen.html?world=${variant.id}` : `/candidates/${variant.id}/${screen}.html?world=${variant.id}`
    for (const size of specimen ? sizes.slice(0, 1) : sizes) jobs.push({ name: `${screen}__${variant.id}__${size.id}`, path, width: size.width, height: size.height, screen, variant: variant.id })
  }
}
if (args.studio) {
  for (const view of ["", "arena"]) jobs.push({ name: `studio${view ? `-${view}` : ""}__1440`, path: view ? `/?view=${view}` : "/", width: 1440, height: 900, studio: true })
  jobs.push({ name: "studio__390", path: "/", width: 390, height: 844, studio: true })
}
if (skipped.length) console.log(`Not built yet, skipped: ${[...new Set(skipped)].join(", ")}`)

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
await mkdir(out, { recursive: true })
const report = []
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.width, height: job.height }, deviceScaleFactor: 1 })
  const problems = []
  page.on("console", (message) => { if (message.type() === "error") problems.push(`console: ${message.text()}`) })
  page.on("pageerror", (error) => problems.push(`page error: ${error.message}`))
  page.on("requestfailed", (request) => problems.push(`request failed: ${request.url()} ${request.failure()?.errorText ?? ""}`))
  page.on("response", (response) => { if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`) })
  await page.goto(base + job.path, { waitUntil: "load" })
  if (job.studio) await page.waitForTimeout(1500)
  else await page.waitForFunction(() => document.documentElement.dataset.studioReady, null, { timeout: 15000 }).catch(() => problems.push("studio frame never became ready"))
  const facts = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    height: document.documentElement.scrollHeight,
    loadedFonts: [...new Set([...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family.replace(/["']/g, "")))],
    tinyText: [...document.querySelectorAll("body *")].filter((element) => element.childNodes.length && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()) && parseFloat(getComputedStyle(element).fontSize) < 11).length,
    clipped: [...document.querySelectorAll("body *")].filter((element) => {
      const style = getComputedStyle(element)
      return (style.overflow === "hidden" || style.textOverflow === "ellipsis") && element.scrollWidth > element.clientWidth + 1 && element.innerText?.trim()
    }).map((element) => element.innerText.trim().slice(0, 40)).slice(0, 8),
  }))
  if (facts.overflowX > 1) problems.push(`page scrolls sideways by ${facts.overflowX}px`)
  if (facts.tinyText) problems.push(`${facts.tinyText} text elements under 11px`)
  const file = `${job.name}.png`
  await page.screenshot({ path: join(out, file), fullPage: true })
  report.push({ ...job, file, ...facts, problems })
  console.log(`${problems.length ? "!" : "✓"} ${file}${problems.length ? `  (${problems.length} problems)` : ""}`)
  await page.close()
}
await browser.close()
await writeFile(join(out, "capture.json"), JSON.stringify({ url: base, at: new Date().toISOString(), shots: report }, null, 2))
const lines = ["# Capture report", "", `Studio: ${base}`, "", ...(skipped.length ? [`Not built yet, so not captured: ${[...new Set(skipped)].join(", ")}`, ""] : []), "| Shot | Height | Fonts loaded | Problems |", "| --- | --- | --- | --- |"]
for (const shot of report) lines.push(`| ${shot.file} | ${shot.height}px | ${shot.loadedFonts.join(", ") || "none"} | ${[...shot.problems, ...(shot.clipped.length ? [`clipped text: ${shot.clipped.join(" · ")}`] : [])].join("<br>") || "none"} |`)
await writeFile(join(out, "capture.md"), lines.join("\n") + "\n")
console.log(`Wrote ${report.length} screenshots and capture.md to ${out}`)

function parseArgs(list) {
  const result = {}
  for (let index = 0; index < list.length; index += 1) {
    const key = list[index].replace(/^--/, "")
    const next = list[index + 1]
    if (next && !next.startsWith("--")) { result[key] = next; index += 1 } else result[key] = true
  }
  return result
}
