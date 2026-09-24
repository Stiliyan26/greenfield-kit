// Find a Playwright copy whose Chromium is installed: STUDIO_PLAYWRIGHT (a package
// folder), a normal import, then the npx cache, newest version first.
import { readdir } from "node:fs/promises"
import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

export async function loadPlaywright() {
  const tried = []
  const folders = []
  if (process.env.STUDIO_PLAYWRIGHT) folders.push(process.env.STUDIO_PLAYWRIGHT)
  else {
    try { return await import("playwright") } catch { tried.push("import('playwright')") }
  }
  const cache = join(homedir(), ".npm", "_npx")
  if (existsSync(cache)) {
    for (const entry of await readdir(cache)) {
      const folder = join(cache, entry, "node_modules", "playwright")
      if (existsSync(join(folder, "package.json"))) folders.push(folder)
    }
  }
  const version = (folder) => JSON.parse(readFileSync(join(folder, "package.json"), "utf8")).version
  folders.sort((a, b) => version(b).localeCompare(version(a), undefined, { numeric: true }))
  for (const folder of folders) {
    tried.push(folder)
    try {
      const module = await import(pathToFileURL(join(folder, "index.mjs")).href)
      const browser = await module.chromium.launch()
      await browser.close()
      return module
    } catch { /* try the next copy */ }
  }
  console.error(`Playwright with a matching Chromium was not found. Tried:\n  ${tried.join("\n  ")}\nInstall with: npx playwright install chromium`)
  process.exit(3)
}
