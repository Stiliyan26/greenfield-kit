// Vite plugin for the studio app.
//
// Before a build or dev server starts it writes one entry page per variant and
// screen into entries/<variant>/<screen>.html. Each page loads the studio's frame
// script first (tokens, fonts, comment pins), then mounts the screen. After a
// build it writes candidates/<variant>/variant.json: the model's own look and
// custom parts from src/variants/<variant>/variant.json, plus one entry for every
// shadcn part the variant's screens import, so the Components view and the
// approval's Components table list them without the model naming each one.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import type { Plugin } from "vite"

const APP = path.resolve(import.meta.dirname)
const STUDIO = path.resolve(APP, "..")
const VARIANTS = path.join(APP, "src/variants")
const ENTRIES = path.join(APP, "entries")
const UI_IMPORT = /from\s+["']@\/components\/ui\/([a-z0-9-]+)["']/g
const LOCAL_IMPORT = /from\s+["'](\.{1,2}\/[^"']+|@\/variants\/[^"']+)["']/g

// shadcn parts whose root element renders nothing: the selector finds the control that opens them.
const OPENED_BY_TRIGGER = new Set(["dialog", "alert-dialog", "sheet", "drawer", "popover", "tooltip", "hover-card", "dropdown-menu", "context-menu", "collapsible"])
const ROOT_SLOT: Record<string, string | null> = {
  select: "select-trigger", combobox: "combobox-trigger", resizable: "resizable-panel-group",
  "native-select": "native-select", direction: null, "tooltip-provider": null,
}

type Screen = { id: string }
type Project = { language?: string; screens?: Screen[] }
type Part = { name: string; what: string; screens: string[]; selector: string; shadcn: string | null; auto?: true }

export function studioPages(): Plugin {
  return {
    name: "studio-pages",
    config() {
      const project = readProject()
      const input: Record<string, string> = {}
      rmSync(ENTRIES, { recursive: true, force: true })
      for (const variant of variantIds()) {
        for (const screen of project.screens || []) {
          const file = path.join(ENTRIES, variant, `${screen.id}.html`)
          mkdirSync(path.dirname(file), { recursive: true })
          writeFileSync(file, entryHtml(variant, screen.id, project.language || "en"))
          input[`${variant}/${screen.id}`] = file
        }
      }
      return { build: { rollupOptions: { input } } }
    },
    transformIndexHtml: {
      order: "post",
      handler: (html) => html.replace("<!-- studio-frame -->", '<script src="/_studio/frame.js"></script>'),
    },
    closeBundle() {
      const screens = readScreens()
      for (const variant of variantIds()) writeVariantJson(variant, screens)
      rmSync(ENTRIES, { recursive: true, force: true })
    },
  }
}

function readProject(): Project {
  return JSON.parse(readFileSync(path.join(STUDIO, "project.json"), "utf8"))
}

function readScreens(): Screen[] {
  return readProject().screens || []
}

function variantIds(): string[] {
  if (!existsSync(VARIANTS)) return []
  return readdirSync(VARIANTS, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
}

// The page's lang is the product's: glyph shapes and line breaks depend on it, and
// the promoted app uses the same one.
function entryHtml(variant: string, screen: string, lang: string): string {
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${variant} · ${screen}</title>
    <!-- studio-frame -->
  </head>
  <body data-variant="${variant}" data-screen="${screen}">
    <div id="root"></div>
    <script type="module" src="../../src/mount.tsx"></script>
  </body>
</html>
`
}

// The shadcn parts each screen reaches, through the variant's own parts.
function shadcnParts(variant: string, screens: Screen[]): Map<string, Set<string>> {
  const folder = path.join(VARIANTS, variant)
  const used = new Map<string, Set<string>>()
  for (const screen of screens) {
    const entry = path.join(folder, "screens", `${screen.id}.tsx`)
    if (!existsSync(entry)) continue
    const seen = new Set<string>()
    const queue = [entry]
    while (queue.length) {
      const file = queue.pop()!
      if (seen.has(file)) continue
      seen.add(file)
      const source = readFileSync(file, "utf8")
      for (const match of source.matchAll(UI_IMPORT)) {
        if (!used.has(match[1])) used.set(match[1], new Set())
        used.get(match[1])!.add(screen.id)
      }
      for (const match of source.matchAll(LOCAL_IMPORT)) {
        const target = resolveLocal(file, match[1])
        if (target && target.startsWith(folder)) queue.push(target)
      }
    }
  }
  return used
}

function resolveLocal(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? path.join(APP, "src", spec.slice(2)) : path.resolve(path.dirname(from), spec)
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (existsSync(candidate) && !candidate.endsWith("/")) return candidate
  }
  return null
}

function selectorFor(name: string): string | null {
  if (name === "sonner") return "[data-sonner-toaster]"
  if (name in ROOT_SLOT) return ROOT_SLOT[name] ? `[data-slot="${ROOT_SLOT[name]}"]` : null
  if (OPENED_BY_TRIGGER.has(name)) return `[data-slot="${name}-trigger"]`
  return `[data-slot="${name}"]`
}

const title = (name: string) => name.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())

function writeVariantJson(variant: string, screens: Screen[]) {
  const source = path.join(VARIANTS, variant, "variant.json")
  if (!existsSync(source)) {
    console.warn(`[studio] src/variants/${variant}/variant.json is missing; the studio will report it`)
    return
  }
  const data = JSON.parse(readFileSync(source, "utf8"))
  const listed: Part[] = Array.isArray(data.components) ? data.components : []
  const names = new Set(listed.map((part) => part.name))
  const auto: Part[] = []
  for (const [name, ids] of [...shadcnParts(variant, screens)].sort()) {
    const selector = selectorFor(name)
    if (!selector) continue
    let label = title(name)
    if (names.has(label)) label = `${label} (shadcn)`
    auto.push({ name: label, what: `shadcn ${name}`, screens: [...ids].sort(), selector, shadcn: name, auto: true })
  }
  const out = { ...data, components: [...listed, ...auto] }
  const target = path.join(STUDIO, "candidates", variant, "variant.json")
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, JSON.stringify(out, null, 2) + "\n")
  console.log(`[studio] candidates/${variant}/variant.json: ${listed.length} listed parts + ${auto.length} shadcn parts`)
}
