#!/usr/bin/env node
// Check each model's components list against its rendered screens, with the same
// reader the studio's Components view uses (web/component-scan.js).
//   node <design-interface>/scripts/check_components.mjs --url http://127.0.0.1:4173 [--variant <id>] [--widths 1440,390]
// A problem is a listed part its selector can't find on a screen it names, or a
// structure drawn more than once (on one screen or across screens) that no part
// covers and notComponents doesn't excuse. Exits 1 when there is any.
import { loadPlaywright } from "./playwright.mjs"

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 ? process.argv[index + 1] : fallback
}
const base = arg("url", "http://127.0.0.1:4173").replace(/\/$/, "")
const only = arg("variant", null)
const widths = arg("widths", "1440,390").split(",").map(Number)

const project = await fetch(`${base}/api/project`).then((response) => response.json())
const variants = project.variants.filter((variant) => !only || variant.id === only)
if (!variants.length) {
  console.error(only ? `No variant '${only}' in the studio at ${base}` : `No variants in the studio at ${base}`)
  process.exit(2)
}
const heights = Object.fromEntries(project._sizes.map((size) => [size.width, size.height]))

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
const problems = []
for (const variant of variants) {
  const label = `Variant '${variant.id}'`
  if (!Array.isArray(variant.components) || !variant.components.length) {
    problems.push(`${label} lists no components in variant.json`)
    continue
  }
  const parts = variant.components.map((part, order) => ({ ...part, order }))
  const ignore = (variant.notComponents || []).map((item) => item.selector)
  const foundSomewhere = new Map()
  const repeats = new Map()
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: heights[width] || 900 } })
    const summaries = []
    for (const screen of project.screens) {
      await page.goto(`${base}/candidates/${encodeURIComponent(variant.id)}/${encodeURIComponent(screen.id)}.html?world=${encodeURIComponent(variant.id)}`)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(200)
      const result = await page.evaluate(async ([list, screenId, skip]) => {
        const { scanDocument } = await import("/_studio/component-scan.js")
        const scan = scanDocument(document, list, screenId, skip)
        return { missing: scan.missing, unlisted: scan.summary.unlisted }
      }, [parts, screen.id, ignore])
      for (const part of parts.filter((item) => item.screens.includes(screen.id))) {
        const key = `${part.name}|${screen.id}`
        foundSomewhere.set(key, (foundSomewhere.get(key) || false) || !result.missing.includes(part.name))
      }
      summaries.push([screen.id, { unlisted: result.unlisted }])
    }
    const found = await page.evaluate(async (list) => (await import("/_studio/component-scan.js")).aggregateUnlisted(list), summaries)
    for (const item of found) {
      const seen = repeats.get(item.signature)
      if (!seen || item.total > seen.total) repeats.set(item.signature, { ...item, width })
    }
    await page.close()
  }
  for (const [key, ok] of foundSomewhere) {
    if (ok) continue
    const [name, screenId] = key.split("|")
    const part = parts.find((item) => item.name === name)
    problems.push(`${label} part ${name} names ${screenId}, but ${part.selector} finds nothing there at ${widths.join(" or ")}`)
  }
  for (const item of repeats.values()) {
    const where = item.screens.map((screen) => `${screen.screenId} ×${screen.count}${screen.host ? ` in ${screen.host}` : ""}`).join(", ")
    problems.push(`${label} draws ${item.signature} ${item.total}× (${where} at ${item.width}) but no part covers it: add it to components, or to notComponents with a reason ("${item.sample}")`)
  }
}
await browser.close()

for (const line of problems) console.log(`✗ ${line}`)
console.log(`${problems.length} problem${problems.length === 1 ? "" : "s"} in ${variants.length} variant${variants.length === 1 ? "" : "s"} (${variants.map((variant) => variant.id).join(", ")}).`)
process.exit(problems.length ? 1 : 0)
