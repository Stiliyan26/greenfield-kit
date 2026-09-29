// End-to-end test of the studio app flow in a throwaway project: init with the app,
// one model's variant in React + shadcn, build, the checks, approval, promotion and
// the pixel comparison. Needs node, npm, python3 and Playwright with Chromium.
//
//   node <design-interface>/scripts/test_app.mjs [--keep]
//
// It installs npm packages twice (studio app, promoted app), so it takes minutes.
import { spawn, spawnSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { loadPlaywright } from "./playwright.mjs"

const skill = dirname(dirname(fileURLToPath(import.meta.url)))
const scripts = join(skill, "scripts")
const keep = process.argv.includes("--keep")
const root = await mkdtemp(join(tmpdir(), "studio-app-test-"))
const studio = join(root, "studio")
const app = join(studio, "app")
const port = 4600 + Math.floor(Math.random() * 300)
const url = `http://127.0.0.1:${port}`
let passed = 0
let failed = 0
let server = null

function check(name, condition, detail = "") {
  if (condition) passed++
  else failed++
  console.log(`${condition ? "✓" : "✗"} ${name}${detail && !condition ? `  (${detail})` : ""}`)
}

function sh(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" })
  return { code: result.status, out: `${result.stdout}${result.stderr}` }
}

async function api(path, body) {
  const response = await fetch(`${url}/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  return { status: response.status, text: await response.text() }
}

try {
  // 1. init with the app
  const init = sh("python3", [join(scripts, "init_studio.py"), root, "--name", "App test"])
  check("init_studio.py creates studio/ and studio/app", init.code === 0 && existsSync(join(app, "src/studio-theme.css")), init.out.slice(-300))
  const ui = existsSync(join(app, "src/components/ui")) ? readdirSync(join(app, "src/components/ui")).length : 0
  check("every shadcn part is installed", ui >= 50, `${ui} files`)

  // 2. project facts, data and one variant
  const project = JSON.parse(readFileSync(join(studio, "project.json"), "utf8"))
  Object.assign(project, {
    language: "bg", scripts: ["latin", "cyrillic"],
    screens: [{ id: "orders", label: "Orders", role: "Staff", requirement: "Staff see today's orders." }, { id: "returns", label: "Returns", role: "Staff", requirement: "Staff see returned parcels." }],
    statusDark: { danger: "oklch(0.7 0.15 27)", warning: "oklch(0.74 0.12 70)", ok: "oklch(0.72 0.13 150)" },
    statusMeaning: { danger: "A failed payment", warning: "A late delivery", ok: "Delivered" },
  })
  await writeFile(join(studio, "project.json"), JSON.stringify(project, null, 2))
  await writeFile(join(app, "src/data.ts"), fixtureData())
  const variant = join(app, "src/variants/paper")
  await mkdir(join(variant, "screens"), { recursive: true })
  await mkdir(join(variant, "parts"), { recursive: true })
  await writeFile(join(variant, "variant.json"), JSON.stringify(fixtureVariant(), null, 2))
  await writeFile(join(variant, "parts/order-card.tsx"), fixturePart())
  await writeFile(join(variant, "screens/orders.tsx"), fixtureScreen("orders"))
  await writeFile(join(variant, "screens/returns.tsx"), fixtureScreen("returns"))

  // 3. build → candidates
  const build = sh("npm", ["run", "build"], app)
  check("npm run build writes the candidate pages", build.code === 0 && existsSync(join(studio, "candidates/paper/orders.html")) && existsSync(join(studio, "candidates/paper/returns.html")), build.out.slice(-400))
  const built = JSON.parse(readFileSync(join(studio, "candidates/paper/variant.json"), "utf8"))
  const auto = (built.components || []).filter((part) => part.auto).map((part) => part.shadcn).sort()
  check("the build lists the shadcn parts the screens import", auto.join(",") === "badge,button,card,tabs", auto.join(","))
  check("the model's own parts stay first", built.components[0].name === "Order card")
  const html = readFileSync(join(studio, "candidates/paper/orders.html"), "utf8")
  check("a built page loads the studio frame script first", html.indexOf("/_studio/frame.js") < html.indexOf("/candidates/assets/"))

  // 4. the studio and its checks
  server = spawn("python3", [join(studio, "server.py"), "--port", String(port)], { cwd: root, stdio: "ignore" })
  await waitFor(url)
  const variantCheck = sh("python3", [join(scripts, "check_variant.py"), studio])
  check("check_variant.py passes", variantCheck.code === 0, variantCheck.out.trim().split("\n").at(-1))
  const componentsCheck = sh("node", [join(scripts, "check_components.mjs"), "--url", url])
  check("check_components.mjs passes (shadcn parts found by data-slot)", componentsCheck.code === 0, componentsCheck.out.trim().split("\n").slice(-3).join(" | "))

  // 5. the live theme
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const probe = async (theme) => {
    await page.goto(`${url}/candidates/paper/orders.html?world=paper${theme === "dark" ? "&theme=dark" : ""}`)
    await page.locator("html[data-studio-ready=true]").waitFor()
    return page.evaluate(() => {
      const token = getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim()
      const button = getComputedStyle(document.querySelector('[data-slot="button"]'))
      const card = getComputedStyle(document.querySelector('[data-slot="card"]'))
      return { token, button: button.backgroundColor, radius: card.borderRadius, heading: getComputedStyle(document.querySelector("h1")).fontFamily }
    })
  }
  const light = await probe("light")
  const dark = await probe("dark")
  check("shadcn button takes the studio's primary token", light.button === light.token && light.token.startsWith("oklch"), `${light.button} vs ${light.token}`)
  check("shadcn card takes the studio's radius", light.radius === "6px", light.radius)
  check("font-heading is the display font", light.heading.includes("Unbounded"), light.heading)
  check("the dark switch recolors shadcn parts with no rebuild", dark.button === dark.token && dark.token !== light.token, `${dark.button} vs ${dark.token}`)
  await browser.close()

  // 6. approve
  await api("api/selection", { variant: "paper" })
  const revision = JSON.parse(readFileSync(join(studio, "selection.json"), "utf8")).revision
  const approve = await api("api/approve", { revision, fontChecks: {} })
  check("approve writes DESIGN.md and design/", approve.status === 200 && existsSync(join(root, "DESIGN.md")) && existsSync(join(root, "design/shadcn.css")), approve.text.slice(0, 200))
  const design = existsSync(join(root, "DESIGN.md")) ? readFileSync(join(root, "DESIGN.md"), "utf8") : ""
  check("DESIGN.md's Components table lists the shadcn parts", design.includes("| Badge |") && design.includes("shadcn `tabs`"))

  // 7. promote and compare
  const promote = sh("python3", [join(scripts, "promote_variant.py"), root, "--check", "--studio-url", url])
  check("promote_variant.py builds web/ from the approved variant", existsSync(join(root, "web/dist/index.html")) && existsSync(join(root, "web/src/design/screens/orders.tsx")), promote.out.slice(-400))
  const css = existsSync(join(root, "web/src/index.css")) ? readFileSync(join(root, "web/src/index.css"), "utf8") : ""
  check("the promoted app imports the approved design files, not the live theme", css.includes("design/shadcn.css") && !css.includes('@import "./studio-theme.css"'))
  const compare = existsSync(join(root, "temp/verification/promote/compare.md")) ? readFileSync(join(root, "temp/verification/promote/compare.md"), "utf8") : ""
  const rows = compare.split("\n").filter((line) => line.startsWith("| orders") || line.startsWith("| returns"))
  check("every route matches the studio within the threshold", promote.code === 0 && rows.length === 12 && rows.every((row) => row.endsWith("| ok |")), rows.filter((row) => !row.endsWith("| ok |")).join(" ") || promote.out.slice(-300))
} finally {
  server?.kill()
  if (keep) console.log(`Kept ${root}`)
  else await rm(root, { recursive: true, force: true })
}
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)

async function waitFor(target) {
  for (let i = 0; i < 50; i++) {
    try { await fetch(target); return } catch { await new Promise((done) => setTimeout(done, 200)) }
  }
  throw new Error(`${target} did not start`)
}

function fixtureData() {
  return `export type Status = "danger" | "warning" | "ok"
export type Order = { id: number; customer: string; note: string; status: Status }
export const data: { today: string; orders: Order[]; returns: Order[] } = {
  today: "2026-01-01",
  orders: [
    { id: 1001, customer: "Иванова", note: "Плащането не мина", status: "danger" },
    { id: 1002, customer: "Петров", note: "Доставена", status: "ok" },
    { id: 1003, customer: "Георгиева", note: "Закъснява", status: "warning" },
  ],
  returns: [{ id: 2001, customer: "Стоянов", note: "Счупена кутия", status: "warning" }],
}
`
}

function fixtureVariant() {
  return {
    model: "Model A", summary: "Warm paper and ink.",
    world: {
      name: "Paper", summary: "Warm paper and ink.", signature: "Ledger rules",
      fonts: { display: "\"Unbounded\", sans-serif", body: "\"Onest\", sans-serif", google: "family=Unbounded:wght@700&family=Onest:wght@400;600" },
      tokens: { "color-bg": "oklch(0.97 0.01 85)", "color-surface": "oklch(0.995 0.005 85)", "color-ink": "oklch(0.25 0.02 260)", "color-muted": "oklch(0.47 0.02 260)", "color-line": "oklch(0.88 0.01 85)", "color-primary": "oklch(0.45 0.12 250)", "color-on-primary": "oklch(0.99 0 0)", "color-accent": "oklch(0.55 0.13 150)", "radius-sm": "3px", "radius-md": "6px" },
      dark: { "color-bg": "oklch(0.18 0.01 260)", "color-surface": "oklch(0.22 0.012 260)", "color-ink": "oklch(0.93 0.01 85)", "color-muted": "oklch(0.72 0.015 85)", "color-line": "oklch(0.32 0.012 260)", "color-primary": "oklch(0.72 0.12 250)", "color-on-primary": "oklch(0.2 0.03 250)", "color-accent": "oklch(0.74 0.13 150)" },
    },
    components: [
      { name: "Order card", what: "One order with its note and action", screens: ["orders", "returns"], selector: "[data-part=order-card]", shadcn: null },
      { name: "Page", what: "The page shell every screen sits in", screens: ["orders", "returns"], selector: "[data-part=page]", shadcn: null },
    ],
  }
}

function fixturePart() {
  return `import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Order } from "@/data"

const label = { danger: "Неплатена", warning: "Закъснява", ok: "Доставена" }

export function OrderCard({ order }: { order: Order }) {
  return (
    <Card data-part="order-card" data-order={order.id} data-status={order.status}>
      <CardHeader>
        <CardTitle className="font-heading">№{order.id} · {order.customer}</CardTitle>
        <Badge variant="outline" style={{ color: \`var(--status-\${order.status})\` }}>{label[order.status]}</Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground">{order.note}</p>
        <Button size="sm">Отвори</Button>
      </CardContent>
    </Card>
  )
}
`
}

function fixtureScreen(id) {
  const tabs = id === "returns"
  return `${tabs ? 'import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"\n' : ""}import { data } from "@/data"
import { OrderCard } from "../parts/order-card"

export default function Screen() {
  return (
    <main data-part="page" className="mx-auto max-w-5xl p-8">
      <h1 className="font-heading text-3xl font-bold">${tabs ? "Върнати пратки" : "Поръчки за днес"}</h1>
${tabs ? '      <Tabs defaultValue="week" className="mt-4"><TabsList><TabsTrigger value="week">Тази седмица</TabsTrigger><TabsTrigger value="all">Всички</TabsTrigger></TabsList></Tabs>\n' : ""}      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.${id}.map((order) => <OrderCard key={order.id} order={order} />)}
      </div>
    </main>
  )
}
`
}
