// Components view: how the selected model builds each screen from parts.
// Screen: the screen beside its tree of parts; pick a part to spotlight it, step
// through its instances and see where it is reused. Parts: a catalog with a live
// crop of every part. Reuse: every part against every screen. Structures the model
// drew more than once but never listed show as "not listed" in all three.
import { gridHtml, catalogHtml, layoutCrops, partStats } from "./components-catalog.js"
import { aggregateUnlisted, pascal, scanDocument } from "./component-scan.js"
import { byId, escapeHtml } from "./util.js"

const ID_LIKE = /^[a-z]{0,2}\d+$/
// A repeat has no name yet; its first words say what it is better than div.who does.
const repeatLabel = (group) => (group.sample ? `“${group.sample.split(" ").slice(0, 4).join(" ")}…”` : group.signature)
const kindOf = (part) => (part.shadcn ? "shadcn" : "custom")

export function createComponentMap(ctx) {
  const { store } = ctx
  const map = { mode: "screen", pick: null, instance: 0, zoom: false, filter: "all", collapsed: new Set(), summaries: new Map(), current: null, loadKey: "", scanning: null }
  const touch = matchMedia("(hover: none)").matches
  store.components = readOpen()
  document.body.classList.toggle("cmap-open", store.components)

  const root = byId("component-map")
  root.addEventListener("click", onClick)
  byId("components-toggle").addEventListener("click", toggle)
  byId("cmap-outlines").addEventListener("change", paint)
  byId("cmap-code").addEventListener("change", renderTree)
  new ResizeObserver(() => { fit(); paint(); if (map.mode === "parts") layoutCrops(byId("cmap-parts")) }).observe(root)

  function toggle() {
    store.components = !store.components
    document.body.classList.toggle("cmap-open", store.components)
    try { localStorage.setItem("studio-components", store.components ? "1" : "0") } catch { /* private window: keep it in memory */ }
    ctx.canvas.render()
  }

  // ── What the view reads ───────────────────────────────────────────────────

  function variant() { return ctx.currentVariant() }
  function parts() { return (variant()?.components || []).map((part, order) => ({ ...part, order, tag: pascal(part.name) })) }
  function ignored() { return (variant()?.notComponents || []).map((item) => item.selector).filter(Boolean) }
  function size() { return store.project._sizes.find((item) => item.width === store.selection.width) || store.project._sizes[0] }
  function screens() { return store.project.screens }
  function screenOf(id) { return screens().find((screen) => screen.id === id) }
  function key(screenId) { return `${store.selection.variant}|${size().width}|${store.theme}|${screenId}` }
  function frameUrl(screenId) {
    const id = encodeURIComponent(store.selection.variant)
    return `/candidates/${id}/${encodeURIComponent(screenId)}.html?world=${id}${store.theme === "dark" ? "&theme=dark" : ""}`
  }
  function summaries() {
    const found = new Map()
    for (const screen of screens()) if (map.summaries.has(key(screen.id))) found.set(screen.id, map.summaries.get(key(screen.id)))
    return found
  }
  // A repeat is worth showing when it is drawn several times, or on two or more screens.
  function repeats() { return aggregateUnlisted(summaries()) }
  function worthShowing(group) {
    return group.count >= 2 || repeats().some((item) => item.signature === group.signature)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function render() {
    byId("components-toggle").setAttribute("aria-pressed", String(store.components))
    if (!store.components) return
    byId("canvas").scrollTo(0, 0)
    for (const button of root.querySelectorAll("[data-cmap-mode]")) button.setAttribute("aria-pressed", String(button.dataset.cmapMode === map.mode))
    const screenId = store.selection.screen
    if (!variant() || !parts().length) return show("empty", `${variant() ? variant().model || variant().id : "This model"} hasn't listed its components in variant.json yet.`)
    if (map.mode === "parts") { show("parts"); renderCatalog(); scanAll(); return }
    if (map.mode === "grid") { show("grid"); renderGrid(); scanAll(); return }
    if (!screenOf(screenId)) return show("empty", "Pick a screen. The fonts and colors page has no components.")
    show("screen")
    if (key(screenId) !== map.loadKey) load(screenId)
    else refresh()
    scanAll()
  }

  function show(which, text = "") {
    byId("cmap-empty").hidden = which !== "empty"
    byId("cmap-empty").textContent = text
    byId("cmap-body").hidden = which !== "screen"
    byId("cmap-parts").hidden = which !== "parts"
    byId("cmap-grid").hidden = which !== "grid"
  }

  function refresh() {
    renderTree()
    renderFocus()
    fit()
    paint()
  }

  // ── Screen: load and read ─────────────────────────────────────────────────

  function loadInto(frame, screenId) {
    const { width, height } = size()
    return new Promise((resolve) => {
      frame.style.width = `${width}px`
      frame.style.height = `${height}px`
      frame.onload = async () => {
        const doc = frame.contentDocument
        await doc.fonts?.ready
        await new Promise((done) => setTimeout(done, 250))
        resolve(doc)
      }
      frame.src = frameUrl(screenId)
    })
  }

  async function load(screenId) {
    const loadKey = key(screenId)
    map.loadKey = loadKey
    map.current = null
    map.instance = 0
    byId("cmap-tree").innerHTML = "<p class='hint cmap-reading'>Reading the screen…</p>"
    fit()
    // Comments find a screen frame by these, so comment mode and pins work here too.
    const frame = byId("cmap-frame")
    Object.assign(frame.dataset, { variant: store.selection.variant, screen: screenId, world: store.selection.variant, width: String(size().width) })
    const doc = await loadInto(frame, screenId)
    if (map.loadKey !== loadKey) return
    const scan = scanDocument(doc, parts(), screenId, ignored())
    map.summaries.set(loadKey, scan.summary)
    map.current = { doc, scan, tree: group(scan.top.children), hover: null, hot: null }
    addOverlay(doc)
    // A pick carried over from another screen stays only if this screen has it.
    if (map.pick && !instances().length) map.pick = null
    refresh()
  }

  // Sibling instances of one part become one line, with what they contain merged.
  function group(instances) {
    const nodes = []
    const index = new Map()
    for (const entry of instances) {
      let node = index.get(entry.part.name)
      if (!node) {
        node = { part: entry.part, also: new Set(), instances: [], opens: new Set(), repeats: new Map() }
        index.set(entry.part.name, node)
        nodes.push(node)
      }
      node.instances.push(entry)
      entry.also.forEach((part) => node.also.add(part.name))
      entry.opens.forEach((part) => node.opens.add(part))
      for (const repeat of entry.repeats) {
        const seen = node.repeats.get(repeat.signature) || { ...repeat, count: 0, elements: [] }
        seen.count += repeat.count
        seen.elements = seen.elements.concat(repeat.elements)
        node.repeats.set(repeat.signature, seen)
      }
    }
    for (const node of nodes) {
      node.children = group(node.instances.flatMap((entry) => entry.children))
      node.props = propsOf(node.instances)
    }
    return nodes
  }

  // The data-* attributes that tell instances apart, shown like props: kind="late|overdue".
  function propsOf(instances) {
    const values = new Map()
    for (const { el } of instances) {
      for (const attr of el.attributes) {
        if (!attr.name.startsWith("data-")) continue
        if (!values.has(attr.name)) values.set(attr.name, new Set())
        values.get(attr.name).add(attr.value)
      }
    }
    const props = []
    for (const [name, set] of values) {
      const list = [...set]
      if (list.length > 3 || list.some((value) => !value || value.length > 16 || ID_LIKE.test(value) || /\s/.test(value))) continue
      props.push({ name: name.slice(5), value: list.join("|") })
    }
    return props.slice(0, 2)
  }

  // The elements the current pick covers on this screen, in document order.
  function instances() {
    const current = map.current
    if (!current || !map.pick) return []
    if (map.pick.kind === "repeat") return current.scan.unlisted.find((item) => item.signature === map.pick.signature)?.elements || []
    return [...current.scan.entries.values()].filter((entry) => entry.part.name === map.pick.name || entry.also.some((part) => part.name === map.pick.name)).map((entry) => entry.el)
  }

  // ── Screen: fit, zoom and overlay ─────────────────────────────────────────

  function fit() {
    if (!store.components || map.mode !== "screen") return
    const stage = byId("cmap-stage")
    const { width, height } = size()
    const room = stage.getBoundingClientRect()
    if (!room.width) return
    let scale = Math.min(1, (room.width - 40) / width)
    const target = map.zoom ? instances()[map.instance] : null
    if (target) {
      const rect = target.getBoundingClientRect()
      scale = Math.max(scale, Math.min(1, (room.width - 80) / (rect.width + 160), (room.height - 80) / (rect.height + 160)))
    }
    byId("cmap-box").style.width = `${Math.round(width * scale)}px`
    byId("cmap-box").style.height = `${Math.round(height * scale)}px`
    byId("cmap-frame").style.transform = `scale(${scale})`
    map.scale = scale
    if (target) {
      const rect = target.getBoundingClientRect()
      stage.scrollTo({ left: rect.left * scale + (rect.width * scale) / 2 - room.width / 2 + 20, top: rect.top * scale + (rect.height * scale) / 2 - room.height / 2 + 20 })
    }
  }

  function addOverlay(doc) {
    const style = doc.createElement("style")
    style.textContent = `
      :where(.__cmap,.__cmap>div){all:initial}
      .__cmap{position:fixed;inset:0;pointer-events:none;z-index:2147483647}
      .__cmap-dim{position:fixed;inset:0;width:100%;height:100%}
      .__cmap-box{position:fixed;display:block;border-radius:4px;box-sizing:border-box}
      .__cmap-custom{outline:1.5px dashed #2a2d33aa;outline-offset:-1px}
      .__cmap-shadcn{outline:1.5px dotted #2a2d3388;outline-offset:-1px}
      .__cmap-repeat{outline:2px dashed #5b6070;outline-offset:-1px;background:repeating-linear-gradient(135deg,#5b607018 0 3px,transparent 3px 7px)}
      .__cmap-hot{outline:2px solid #3b6fe0;outline-offset:1px;background:#3b6fe014}
      .__cmap-pick{outline:2px solid #3b6fe0;outline-offset:2px}
      .__cmap-pick.__cmap-repeat-pick{outline-color:#5b6070;outline-style:dashed}
      .__cmap-now{outline-width:3px}
      .__cmap-tag{position:fixed;display:block;padding:2px 7px;border-radius:5px 5px 5px 0;background:#3b6fe0;color:#fff;font:500 11px/1.35 ui-monospace,"SF Mono",Menlo,monospace;white-space:nowrap}
      .__cmap-tag-repeat{background:#3d414c}
      html.__cmap-on:not(.__studio-picking),html.__cmap-on:not(.__studio-picking) *{cursor:default!important}`
    const layer = doc.createElement("div")
    layer.className = "__cmap"
    doc.head.append(style)
    doc.body.append(layer)
    doc.documentElement.classList.add("__cmap-on")
    doc.addEventListener("scroll", paint, { capture: true, passive: true })
    doc.addEventListener("mousemove", (event) => {
      if (doc.documentElement.classList.contains("__studio-picking")) return
      const found = targetAt(event.target)
      if (found?.el === map.current.hover?.el) return
      map.current.hover = found
      lightRows(found)
      paint()
    })
    doc.addEventListener("mouseleave", () => { map.current.hover = null; lightRows(null); paint() })
    // Clicks pick a part instead of following links or pressing the mock buttons.
    // In comment mode the click belongs to the comment.
    doc.addEventListener("click", (event) => {
      if (doc.documentElement.classList.contains("__studio-picking")) return
      event.preventDefault()
      event.stopPropagation()
      const found = targetAt(event.target)
      if (!found) return pick(null)
      pick(found.kind === "part" ? { kind: "part", name: found.entry.part.name } : { kind: "repeat", signature: found.group.signature })
    }, true)
    map.current.layer = layer
  }

  // The innermost listed part or not-listed repeat under the pointer.
  function targetAt(target) {
    const { entries, unlisted } = map.current.scan
    for (let node = target; node; node = node.parentElement) {
      if (entries.has(node)) return { kind: "part", el: node, entry: entries.get(node) }
      const group = unlisted.find((item) => item.elements.includes(node) && worthShowing(item))
      if (group) return { kind: "repeat", el: node, group }
    }
    return null
  }

  function paint() {
    const current = map.current
    if (!current?.layer) return
    const view = current.doc.defaultView
    const boxes = []
    const add = (el, className, label = "", labelClass = "") => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const classes = className.split(" ").filter(Boolean).map((name) => `__cmap-${name}`).join(" ")
      boxes.push(`<div class="__cmap-box ${classes}" style="left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px"></div>`)
      // The label sits just above the part, or inside its top edge when there is no room.
      if (label) boxes.push(`<div class="__cmap-tag${labelClass ? " __cmap-tag-repeat" : ""}" style="left:${rect.left - 2}px;top:${rect.top >= 22 ? rect.top - 21 : rect.top}px">${escapeHtml(label)}</div>`)
    }
    if (byId("cmap-outlines").checked) {
      for (const entry of current.scan.entries.values()) add(entry.el, kindOf(entry.part))
    }
    const picked = instances()
    if (picked.length) {
      // Spotlight: dim everything but the picked instances.
      const holes = picked.map((el) => el.getBoundingClientRect()).map((r) => `M${r.left - 4} ${r.top - 4}h${r.width + 8}v${r.height + 8}h${-(r.width + 8)}z`).join("")
      boxes.push(`<svg class="__cmap-dim" aria-hidden="true"><path style="fill:#11141a;fill-opacity:.34;fill-rule:evenodd" d="M0 0h${view.innerWidth}v${view.innerHeight}h${-view.innerWidth}z${holes}"/></svg>`)
      const repeat = map.pick.kind === "repeat"
      const name = repeat ? repeatLabel(current.scan.unlisted.find((item) => item.signature === map.pick.signature) || { signature: map.pick.signature }) : pascal(map.pick.name)
      picked.forEach((el, index) => add(el, `pick${repeat ? " repeat-pick" : ""}${index === map.instance ? " now" : ""}`, index === map.instance ? `${name} ${index + 1}/${picked.length}` : "", repeat ? "repeat" : ""))
    }
    const hot = current.hot || (current.hover ? [current.hover.el] : [])
    const hotLabel = current.hotLabel || (current.hover ? (current.hover.kind === "part" ? current.hover.entry.part.tag : repeatLabel(current.hover.group)) : "")
    hot.forEach((el, index) => add(el, "hot", index ? "" : `${hotLabel}${hot.length > 1 ? ` ×${hot.length}` : ""}`))
    current.layer.innerHTML = boxes.join("")
  }

  // ── Screen: tree ──────────────────────────────────────────────────────────

  // One line per part: indent guides, a shape for its kind (filled = built by
  // hand, outlined = shadcn, dashed = not listed), its name and how many.
  function renderTree() {
    const current = map.current
    if (!current) return
    const screen = screenOf(store.selection.screen)
    const code = byId("cmap-code").checked
    const rows = []
    const index = []
    const isPicked = (node) => map.pick?.kind === "part" && (map.pick.name === node.part.name || node.also.has(map.pick.name))
    const times = (n) => (n > 1 ? `<span class="cmap-times">×${n}</span>` : "")
    const opensLine = (set, depth) => `<div class="cmap-opens-line" style="--depth:${depth}"><span class="cmap-indent"></span><span class="cmap-opens-mark">opens</span>${[...set].map((part) => `<button type="button" data-cmap-pick="${escapeHtml(part.name)}" title="${escapeHtml(part.what || "")}">${escapeHtml(part.tag)}</button>`).join('<span class="cmap-sep">·</span>')}</div>`
    const repeatRows = (groups, depth) => groups.filter(worthShowing).map((groupItem) => {
      const id = index.push({ repeat: groupItem }) - 1
      const picked = map.pick?.kind === "repeat" && map.pick.signature === groupItem.signature
      return `<div class="cmap-row is-repeat${picked ? " picked" : ""}" data-node="${id}" style="--depth:${depth}" title="Drawn ${groupItem.count}× but not in the components list: “${escapeHtml(groupItem.sample)}”">
        <span class="cmap-indent"></span><span class="cmap-caret"></span><span class="cmap-glyph"></span>
        <span class="cmap-line"><span class="cmap-name">${escapeHtml(repeatLabel(groupItem))}</span>${times(groupItem.count)}${code ? `<span class="cmap-sig-code">${escapeHtml(groupItem.signature)}</span>` : ""}</span>
        <span class="cmap-kindtext">not listed</span>
      </div>`
    }).join("")
    const line = (node, depth, path) => {
      const id = index.push(node) - 1
      const rowKey = `${store.selection.variant}/${screen.id}/${path}`
      const open = !map.collapsed.has(rowKey)
      const kind = kindOf(node.part)
      const kids = node.children.length > 0 || [...node.repeats.values()].some(worthShowing)
      const props = code ? node.props.map((prop) => ` <span class="prop">${escapeHtml(prop.name)}=<span class="v">"${escapeHtml(prop.value)}"</span></span>`).join("") : ""
      const name = `<span class="lt">&lt;</span>${escapeHtml(node.part.tag)}${props}<span class="lt">${kids && open ? "&gt;" : " /&gt;"}</span>`
      rows.push(`<div class="cmap-row is-${kind}${isPicked(node) ? " picked" : ""}" role="treeitem" data-node="${id}" data-key="${escapeHtml(rowKey)}" style="--depth:${depth}"${kids ? ` aria-expanded="${open}"` : ""} title="${escapeHtml(node.part.what || "")}">
        <span class="cmap-indent"></span>
        ${kids ? `<button type="button" class="cmap-caret" data-cmap-fold aria-label="${open ? "Fold" : "Unfold"}">${open ? "▾" : "▸"}</button>` : `<span class="cmap-caret"></span>`}
        <span class="cmap-glyph"></span>
        <span class="cmap-line"><span class="cmap-name">${name}</span>${times(node.instances.length)}${node.also.size && code ? ` <span class="cmap-also">is also ${[...node.also].map(escapeHtml).join(", ")}</span>` : ""}</span>
        <span class="cmap-kindtext">${kind === "shadcn" ? escapeHtml(node.part.shadcn) : "custom"}</span>
      </div>`)
      if (node.opens.size) rows.push(opensLine(node.opens, depth + 1))
      if (kids && open) {
        node.children.forEach((child, number) => line(child, depth + 1, `${path}.${number}`))
        rows.push(repeatRows([...node.repeats.values()], depth + 1))
        if (code) rows.push(`<div class="cmap-row is-close" style="--depth:${depth}"><span class="cmap-indent"></span><span class="cmap-caret"></span><span class="cmap-glyph"></span><span class="cmap-line"><span class="cmap-name"><span class="lt">&lt;/</span>${escapeHtml(node.part.tag)}<span class="lt">&gt;</span></span></span></div>`)
      }
    }
    const page = `${pascal(screen.id)}Page`
    rows.push(`<div class="cmap-row is-page" style="--depth:0"><span class="cmap-indent"></span><span class="cmap-caret"></span><span class="cmap-glyph"></span><span class="cmap-line"><span class="cmap-name"><span class="lt">&lt;</span>${escapeHtml(page)}<span class="lt">&gt;</span></span></span><span class="cmap-kindtext">page</span></div>`)
    if (current.scan.top.opens.length) rows.push(opensLine(new Set(current.scan.top.opens), 1))
    current.tree.forEach((node, number) => line(node, 1, String(number)))
    rows.push(repeatRows(current.scan.top.repeats, 1))
    if (code) rows.push(`<div class="cmap-row is-close is-page" style="--depth:0"><span class="cmap-indent"></span><span class="cmap-caret"></span><span class="cmap-glyph"></span><span class="cmap-line"><span class="cmap-name"><span class="lt">&lt;/</span>${escapeHtml(page)}<span class="lt">&gt;</span></span></span></div>`)
    byId("cmap-tree").innerHTML = rows.join("")
    current.index = index
    const names = new Set([...current.scan.entries.values()].map((entry) => entry.part.name))
    const handMade = [...names].filter((name) => !parts().find((part) => part.name === name)?.shadcn).length
    byId("cmap-tree-meta").textContent = `${handMade} by hand · ${names.size - handMade} shadcn`
    for (const row of byId("cmap-tree").querySelectorAll("[data-node]")) {
      const node = index[Number(row.dataset.node)]
      row.addEventListener("mouseenter", () => {
        current.hot = node.repeat ? node.repeat.elements : node.instances.map((entry) => entry.el)
        current.hotLabel = node.repeat ? repeatLabel(node.repeat) : node.part.tag
        paint()
      })
      row.addEventListener("mouseleave", () => { current.hot = null; current.hotLabel = ""; paint() })
    }
  }

  function lightRows(found) {
    let first = null
    for (const row of byId("cmap-tree").querySelectorAll("[data-node]")) {
      const node = map.current.index[Number(row.dataset.node)]
      const hot = Boolean(found) && (node.repeat ? found.kind === "repeat" && node.repeat.signature === found.group.signature : found.kind === "part" && node.instances.includes(found.entry))
      row.classList.toggle("hot", hot)
      if (hot && !first) first = row
    }
    if (first) keepInView(byId("cmap-tree"), first)
  }

  // ── Screen: the bar over the screen ────────────────────────────────────────

  function renderFocus() {
    const bar = byId("cmap-focus")
    const picked = instances()
    bar.hidden = !map.pick
    if (!map.pick) return
    const name = map.pick.kind === "repeat" ? repeatLabel(map.current?.scan.unlisted.find((item) => item.signature === map.pick.signature) || { signature: map.pick.signature }) : pascal(map.pick.name)
    bar.innerHTML = `
      <code class="cmap-focus-name${map.pick.kind === "repeat" ? " repeat" : ""}">${escapeHtml(name)}</code>
      <span class="cmap-focus-meta">${escapeHtml(usage())}</span>
      ${picked.length > 1 ? `<span class="cmap-step"><button type="button" class="icon-btn" data-cmap-step="-1" aria-label="Previous instance">‹</button><span class="num">${map.instance + 1} of ${picked.length}</span><button type="button" class="icon-btn" data-cmap-step="1" aria-label="Next instance">›</button></span>` : ""}
      <button type="button" class="btn btn-quiet btn-small" data-cmap-zoom aria-pressed="${map.zoom}">${map.zoom ? "Whole screen" : "Zoom in"}</button>
      <button type="button" class="icon-btn cmap-x" data-cmap-clear aria-label="Clear the pick" title="Clear the pick (Esc)">×</button>`
  }

  // How widely the pick is used, from the screens read so far.
  function usage() {
    const all = summaries()
    let total = 0
    let used = 0
    for (const summary of all.values()) {
      const n = map.pick.kind === "repeat" ? summary.unlisted.find((item) => item.signature === map.pick.signature)?.count ?? 0 : summary.parts.get(map.pick.name)?.count ?? 0
      total += n
      used += n > 0 ? 1 : 0
    }
    const kind = map.pick.kind === "repeat" ? "not a part yet" : parts().find((part) => part.name === map.pick.name)?.shadcn || "custom"
    return `${kind} · ${total} on ${used} of ${screens().length} screens`
  }

  function pick(next) {
    map.pick = next
    map.instance = 0
    if (!next) map.zoom = false
    if (map.current) {
      revealInScreen(instances()[0])
      refresh()
    }
    if (map.mode === "grid") renderGrid()
  }

  function step(delta) {
    const picked = instances()
    if (picked.length < 2) return
    map.instance = (map.instance + delta + picked.length) % picked.length
    revealInScreen(picked[map.instance])
    renderFocus()
    fit()
    paint()
  }

  // ── Parts and Reuse ───────────────────────────────────────────────────────

  function renderCatalog() {
    const box = byId("cmap-parts")
    const all = summaries()
    const stats = partStats(parts(), screens(), all)
    const progress = all.size < screens().length ? `<p class="hint cmap-reading">Reading screen ${all.size + 1} of ${screens().length}…</p>` : ""
    box.innerHTML = progress + catalogHtml({ stats, repeats: repeats(), filter: map.filter, frameUrl, pageSize: size() })
    requestAnimationFrame(() => layoutCrops(box))
  }

  function renderGrid() {
    byId("cmap-grid-table").innerHTML = gridHtml({ stats: partStats(parts(), screens(), summaries()), repeats: repeats(), screens: screens(), pick: map.pick })
  }

  // Read every screen of the selected model at this size once, in a hidden frame.
  function scanAll() {
    const want = `${store.selection.variant}|${size().width}|${store.theme}`
    if (map.scanning === want) return
    map.scanning = want
    const frame = document.createElement("iframe")
    frame.setAttribute("aria-hidden", "true")
    frame.tabIndex = -1
    byId("cmap-scanner").replaceChildren(frame)
    ;(async () => {
      for (const screen of screens()) {
        if (map.summaries.has(key(screen.id))) continue
        const doc = await loadInto(frame, screen.id)
        if (map.scanning !== want) return
        map.summaries.set(key(screen.id), scanDocument(doc, parts(), screen.id, ignored()).summary)
        if (map.mode === "parts") renderCatalog()
        else if (map.mode === "grid") renderGrid()
        else if (map.current) { renderTree(); renderFocus() }
      }
      frame.remove()
    })()
  }

  // ── Events ────────────────────────────────────────────────────────────────

  function goTo(screenId, next) {
    map.mode = "screen"
    map.pick = next
    if (screenId === store.selection.screen) render()
    else ctx.change({ screen: screenId })
  }

  function onClick(event) {
    const target = event.target.closest("button, [data-node]")
    if (!target) return
    const data = target.dataset
    if (data.cmapMode) { map.mode = data.cmapMode; render(); return }
    if (data.cmapFilter) { map.filter = data.cmapFilter; renderCatalog(); return }
    if (data.cmapOpen) {
      const row = partStats(parts(), screens(), summaries()).find((item) => item.part.name === data.cmapOpen)
      const first = screens()[row.perScreen.findIndex((n) => n > 0)]
      return goTo(first?.id ?? store.selection.screen, { kind: "part", name: data.cmapOpen })
    }
    if (data.cmapOpenRepeat) return goTo(data.screen, { kind: "repeat", signature: data.cmapOpenRepeat })
    if (data.cmapScreen) {
      const next = data.cmapPart ? { kind: "part", name: data.cmapPart } : data.cmapRepeat ? { kind: "repeat", signature: data.cmapRepeat } : map.pick
      return goTo(data.cmapScreen, next)
    }
    if (data.cmapClear !== undefined) return pick(null)
    if (data.cmapStep) return step(Number(data.cmapStep))
    if (data.cmapZoom !== undefined) { map.zoom = !map.zoom; renderFocus(); fit(); paint(); return }
    if (data.cmapPick) return pick({ kind: "part", name: data.cmapPick })
    if (data.cmapRepeatPick) return pick({ kind: "repeat", signature: data.cmapRepeatPick })
    if (data.cmapLook) {
      const index = instances().findIndex((el) => [...el.classList].slice(1).join(" ") === data.cmapLook)
      if (index >= 0) { map.instance = index; step(0) }
      return
    }
    const row = target.closest("[data-node]")
    if (!row || !map.current) return
    const node = map.current.index[Number(row.dataset.node)]
    if (event.target.closest("[data-cmap-fold]")) {
      const rowKey = row.dataset.key
      if (map.collapsed.has(rowKey)) map.collapsed.delete(rowKey)
      else map.collapsed.add(rowKey)
      renderTree()
      return
    }
    if (node.repeat) pick(map.pick?.signature === node.repeat.signature ? null : { kind: "repeat", signature: node.repeat.signature })
    else pick(map.pick?.name === node.part.name ? null : { kind: "part", name: node.part.name })
  }

  // Scroll only the screen's own window, never the studio around it.
  function revealInScreen(el) {
    if (!el || !map.current) return
    const view = map.current.doc.defaultView
    const rect = el.getBoundingClientRect()
    if (rect.top < 0 || rect.bottom > view.innerHeight) view.scrollBy(0, rect.top - view.innerHeight / 3)
  }

  function clearPick() {
    if (!map.pick) return false
    pick(null)
    return true
  }

  function close() { if (store.components) toggle() }

  return { render, toggle, close, clearPick, isOpen: () => store.components }
}

// Scroll a list so a row is visible, without moving any outer container.
function keepInView(list, row) {
  const box = list.getBoundingClientRect()
  const rect = row.getBoundingClientRect()
  if (rect.top >= box.top && rect.bottom <= box.bottom) return
  list.scrollTop += rect.top - box.top - (box.height - rect.height) / 2
}

function readOpen() {
  try { return localStorage.getItem("studio-components") === "1" } catch { return false }
}
