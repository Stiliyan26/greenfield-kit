// Reads one rendered screen against a model's components list (variant.json).
// Shared by the studio's Components view and scripts/check_components.mjs, so the
// page and the quality gate find the same parts and the same gaps.

// Parts that open on top of the screen attach to the part that opens them.
export const OVERLAYS = new Set(["dialog", "alert-dialog", "sheet", "drawer", "command", "popover", "tooltip", "hover-card", "sonner", "dropdown-menu", "context-menu", "calendar"])
const INTERACTIVE = new Set(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "LABEL"])
// shadcn parts that bring their own items: the chips of a toggle group, the rows of a table.
const COMPOSITES = new Set(["toggle-group", "tabs", "table", "breadcrumb", "button-group", "select", "radio-group", "accordion", "navigation-menu", "menubar", "pagination", "command", "sidebar"])
const MIN_AREA = 400
const MAX_LOOKS = 4

export const pascal = (name) => name.split(/[^A-Za-z0-9]+/).filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join("")
export const isOverlay = (part) => OVERLAYS.has(part.shadcn)

// Every listed part found on the screen, nested by what sits inside what, plus the
// repeated structures no part covers. `ignore` holds the selectors the model marked
// as not a part (variant.json `notComponents`).
export function scanDocument(doc, parts, screenId, ignore = []) {
  const here = parts.filter((part) => part.screens.includes(screenId))
  // The studio's own pins and highlights live in the screen too; they are never parts.
  const found = (part) => { try { return [...doc.querySelectorAll(part.selector)].filter((el) => isVisible(el) && !isStudio(el)) } catch { return [] } }
  const entries = new Map()
  const counts = new Map()
  for (const part of here.filter((item) => !isOverlay(item))) {
    const elements = found(part)
    counts.set(part.name, elements.length)
    for (const el of elements) {
      const entry = entries.get(el) || { el, parts: [], opens: [], children: [], repeats: [] }
      entry.parts.push(part)
      entries.set(el, entry)
    }
  }
  // Where one element is several parts, the rarer part is the specific one (Order card over Card).
  for (const entry of entries.values()) {
    entry.parts.sort((a, b) => counts.get(a.name) - counts.get(b.name) || b.order - a.order)
    entry.part = entry.parts[0]
    entry.also = entry.parts.slice(1)
  }
  const top = { children: [], opens: [], repeats: [] }
  // Walk up to <body> included: a page shell may be the body itself.
  const hostOf = (el) => { for (let node = el; node && node !== doc.documentElement; node = node.parentElement) if (entries.has(node)) return entries.get(node); return top }
  const triggers = new Map()
  for (const part of here.filter(isOverlay)) {
    const elements = found(part)
    counts.set(part.name, elements.length)
    if (elements.length) triggers.set(part.name, elements[0])
    for (const el of elements) {
      const host = hostOf(el)
      if (!host.opens.includes(part)) host.opens.push(part)
    }
  }
  const ordered = [...entries.values()].sort(byDocumentOrder)
  for (const entry of ordered) (entry.el.parentElement ? hostOf(entry.el.parentElement) : top).children.push(entry)
  const unlisted = findUnlisted(doc, entries, hostOf, ignore)
  for (const group of unlisted) {
    const host = hostOf(group.elements[0].parentElement)
    group.host = host === top ? null : host.part.name
    host.repeats.push(group)
  }
  const missing = here.filter((part) => !counts.get(part.name)).map((part) => part.name)
  return { top, entries, counts, unlisted, missing, summary: summarize(entries, counts, unlisted, triggers, missing) }
}

// Structures the screen repeats that no listed part covers: a row drawn five times
// inside a list, a header on every screen. Grouped by tag and first class, which is
// how hand-written screens name a base style (`class="who is-busy"` → div.who).
function findUnlisted(doc, entries, hostOf, ignore) {
  const partEls = [...entries.keys()]
  const ignored = (el) => ignore.some((selector) => { try { return el.matches(selector) } catch { return false } })
  const groups = new Map()
  for (const el of doc.body.querySelectorAll("[class]")) {
    if (entries.has(el) || !isVisible(el) || isStudio(el) || isIcon(el)) continue
    const base = el.classList[0]
    if (!base || base.startsWith("__") || ignored(el)) continue
    const size = area(el)
    if (size < MIN_AREA || !(el.childElementCount >= 2 || INTERACTIVE.has(el.tagName))) continue
    // A wrapper that is mostly one listed part is that part; one that only holds a
    // run of the same thing is the list, and the repeated item is what matters.
    if (partEls.some((part) => el.contains(part) && area(part) >= 0.8 * size)) continue
    if (isListWrapper(el, entries)) continue
    const signature = `${el.tagName.toLowerCase()}.${base}`
    if (!groups.has(signature)) groups.set(signature, { signature, selector: `.${cssEscape(base)}`, elements: [] })
    groups.get(signature).elements.push(el)
  }
  const list = [...groups.values()].filter((group) => {
    // Once inside each instance of a part is that part's own layout (the header of
    // every card), not a missing part. Several inside one part are items of a list.
    const perHost = new Map()
    for (const el of group.elements) {
      const host = hostOf(el.parentElement)
      perHost.set(host, (perHost.get(host) || 0) + 1)
    }
    const hostless = [...perHost.keys()].some((host) => !host.part)
    if (hostless) return true
    return [...perHost].some(([host, n]) => n > 1 && !COMPOSITES.has(host.part.shadcn))
  })
  // Keep the outer structure: drop a group wrapped one to one by another group, like
  // the name inside each customer row. A page shell holding many rows drops nothing.
  const inner = new Set()
  for (const outer of list) {
    for (const group of list) {
      if (group === outer || inner.has(group)) continue
      const wrapped = group.elements.every((el) => outer.elements.some((box) => box !== el && box.contains(el)))
      const oneEach = outer.elements.every((box) => group.elements.filter((el) => box.contains(el)).length <= 1)
      if (wrapped && oneEach) inner.add(group)
    }
  }
  return list.filter((group) => !inner.has(group)).map((group) => ({
    signature: group.signature,
    selector: group.selector,
    count: group.elements.length,
    elements: group.elements,
    sample: sampleText(group.elements[0]),
    rect: pageRect(group.elements[0]),
  })).sort((a, b) => b.count - a.count)
}

// What the catalog and the reuse grid need after the screen's document is gone:
// counts, and where to crop each distinct look of a part.
function summarize(entries, counts, unlisted, triggers, missing) {
  const parts = new Map()
  for (const entry of [...entries.values()].sort(byDocumentOrder)) {
    for (const part of [entry.part, ...entry.also]) {
      const item = parts.get(part.name) || { count: 0, looks: [] }
      item.count += 1
      const look = lookOf(entry.el)
      if (item.looks.length < MAX_LOOKS && !item.looks.some((seen) => seen.look === look)) item.looks.push({ look, rect: pageRect(entry.el) })
      parts.set(part.name, item)
    }
  }
  // A dialog or menu isn't drawn; the catalog shows the control that opens it.
  for (const [name, el] of triggers) parts.set(name, { count: counts.get(name), looks: [{ look: "trigger", rect: pageRect(el) }], trigger: true })
  for (const [name, count] of counts) if (!parts.has(name)) parts.set(name, { count, looks: [] })
  return {
    parts,
    missing,
    unlisted: unlisted.map(({ signature, selector, count, sample, rect, host }) => ({ signature, selector, count, sample, rect, host })),
  }
}

// Instances that differ in their classes or state attributes look different (paid, late, overdue).
function lookOf(el) {
  const state = [...el.attributes].filter((attr) => /^(data-(state|kind|status|variant|tone)|aria-(current|pressed|selected))$/.test(attr.name)).map((attr) => `${attr.name}=${attr.value}`)
  return [...el.classList].sort().concat(state).join(" ")
}

function pageRect(el) {
  const rect = el.getBoundingClientRect()
  const view = el.ownerDocument.defaultView
  return { x: Math.round(rect.left + view.scrollX), y: Math.round(rect.top + view.scrollY), w: Math.round(rect.width), h: Math.round(rect.height) }
}

function byDocumentOrder(a, b) {
  return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
}

function isStudio(el) {
  return Boolean(el.closest("[class^='__'], [class*=' __']"))
}

function isListWrapper(el, entries) {
  const children = [...el.children].filter(isVisible)
  if (children.length < 2) return false
  const key = (child) => entries.get(child)?.part?.name ?? `${child.tagName}.${child.classList[0] || ""}`
  return children.every((child) => key(child) === key(children[0]))
}

// Icons come from the icon set, not the components list: an svg, or a small wrapper
// around one with at most a count ("4").
function isIcon(el) {
  if (el instanceof el.ownerDocument.defaultView.SVGElement) return true
  return Boolean(el.querySelector("svg")) && (el.textContent || "").trim().length <= 3
}

function isVisible(el) {
  if (!el.getClientRects().length) return false
  const style = el.ownerDocument.defaultView.getComputedStyle(el)
  return style.visibility !== "hidden" && style.display !== "none"
}

function area(el) {
  const rect = el.getBoundingClientRect()
  return rect.width * rect.height
}

function sampleText(el) {
  return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60)
}

function cssEscape(value) {
  return globalThis.CSS?.escape ? CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&")
}

// Across every screen: repeats worth a part. Several on one screen, or the same
// structure on two or more screens.
export function aggregateUnlisted(summaries) {
  const all = new Map()
  for (const [screenId, summary] of summaries) {
    for (const group of summary.unlisted) {
      const item = all.get(group.signature) || { signature: group.signature, selector: group.selector, total: 0, screens: [], sample: group.sample, first: null }
      item.total += group.count
      item.screens.push({ screenId, count: group.count, host: group.host })
      item.first ||= { screenId, rect: group.rect }
      all.set(group.signature, item)
    }
  }
  return [...all.values()]
    .filter((item) => item.screens.length >= 2 || item.screens.some((screen) => screen.count >= 2))
    .sort((a, b) => b.screens.length - a.screens.length || b.total - a.total)
}
