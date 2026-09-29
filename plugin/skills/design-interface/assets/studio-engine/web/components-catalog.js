// The Components view's Parts catalog and Reuse grid. Both read the per-screen
// summaries that component-scan.js makes, so they work after the screens are gone.
import { escapeHtml } from "./util.js"

const CROP_PAD = 10
const MAX_CROPS = 2

// One line per part: how often it is used, where, and where to crop its looks.
export function partStats(parts, screens, summaries) {
  return parts.map((part) => {
    const perScreen = screens.map((screen) => summaries.get(screen.id)?.parts.get(part.name)?.count ?? (summaries.has(screen.id) ? 0 : null))
    const looks = []
    let trigger = false
    for (const screen of screens) {
      const item = summaries.get(screen.id)?.parts.get(part.name)
      if (!item) continue
      trigger ||= Boolean(item.trigger)
      for (const look of item.looks) if (!looks.some((seen) => seen.look === look.look)) looks.push({ ...look, screenId: screen.id })
    }
    return { part, perScreen, total: perScreen.reduce((sum, n) => sum + (n || 0), 0), used: perScreen.filter((n) => n > 0).length, looks, trigger }
  })
}

export function catalogHtml({ stats, repeats, filter, frameUrl, pageSize }) {
  const custom = stats.filter((row) => !row.part.shadcn)
  const shadcn = stats.filter((row) => row.part.shadcn)
  const counts = { all: stats.length + repeats.length, custom: custom.length, shadcn: shadcn.length, repeats: repeats.length }
  const chip = (id, label) => `<button type="button" class="cmap-filter" data-cmap-filter="${id}" aria-pressed="${filter === id}">${label} <span>${counts[id]}</span></button>`
  const section = (id, title, note, cards) => (filter === "all" || filter === id) && cards.length
    ? `<section class="cmap-section"><header><h3>${title}</h3><p class="hint">${note}</p></header><div class="cmap-cards">${cards.join("")}</div></section>`
    : ""
  const partCard = (row) => {
    const kind = row.part.shadcn ? "shadcn" : "custom"
    const crops = row.looks.slice(0, MAX_CROPS).map((look) => crop(frameUrl(look.screenId), look.rect, pageSize)).join("")
    const preview = crops || `<p class="cmap-nopreview">Not on any screen at this size</p>`
    const looks = row.looks.length > 1 && !row.trigger ? `<span class="cmap-pill">${row.looks.length} looks</span>` : ""
    return `<article class="cmap-part${row.looks.length > 1 && !row.trigger ? " wide" : ""}">
      <button type="button" class="cmap-part-open" data-cmap-open="${escapeHtml(row.part.name)}" aria-label="Show ${escapeHtml(row.part.name)} on its screen">
        <div class="cmap-preview${row.trigger ? " trigger" : ""}">${preview}${row.trigger ? `<span class="cmap-opens-note"><span class="cmap-opens-mark">opens</span> from this control</span>` : ""}</div>
        <div class="cmap-part-body">
          <div class="cmap-part-head"><code>${escapeHtml(row.part.tag)}</code><span class="cmap-kind ${kind}">${kind === "shadcn" ? escapeHtml(row.part.shadcn) : "custom"}</span></div>
          <p class="cmap-part-meta">${row.total} use${row.total === 1 ? "" : "s"} · ${row.used} of ${row.perScreen.length} screens ${looks}</p>
          <p class="cmap-part-what">${escapeHtml(row.part.what || "")}</p>
        </div>
      </button>
    </article>`
  }
  const repeatCard = (item) => `<article class="cmap-part is-repeat">
      <button type="button" class="cmap-part-open" data-cmap-open-repeat="${escapeHtml(item.signature)}" data-screen="${escapeHtml(item.first.screenId)}">
        <div class="cmap-preview">${crop(frameUrl(item.first.screenId), item.first.rect, pageSize)}</div>
        <div class="cmap-part-body">
          <div class="cmap-part-head"><span class="cmap-repeat-name">“${escapeHtml(item.sample.split(" ").slice(0, 5).join(" "))}…”</span><span class="cmap-kind repeat">not listed</span></div>
          <p class="cmap-part-meta">${item.total}× on ${item.screens.length} screen${item.screens.length === 1 ? "" : "s"}</p>
          <p class="cmap-part-what"><code>${escapeHtml(item.signature)}</code></p>
        </div>
      </button>
    </article>`
  const byUse = (a, b) => b.used - a.used || b.total - a.total || a.part.order - b.part.order
  return `<div class="cmap-filters" role="group" aria-label="Show">${chip("all", "All")}${chip("custom", "Build by hand")}${chip("shadcn", "From shadcn")}${chip("repeats", "Not listed yet")}</div>
    ${section("repeats", "Not listed yet", "Drawn more than once, but the model didn't name it as a part. The model adds each one, or marks it as not a part and says why.", repeats.map(repeatCard))}
    ${section("custom", "Build by hand", "This product's own parts. The components stage builds each one from these screens.", custom.sort(byUse).map(partCard))}
    ${section("shadcn", "From shadcn", "Added with the shadcn skill and themed by design/shadcn.css.", shadcn.sort(byUse).map(partCard))}`
}

export function gridHtml({ stats, repeats, screens, pick }) {
  const max = Math.max(1, ...stats.flatMap((row) => row.perScreen.map((n) => n || 0)), ...repeats.flatMap((item) => item.screens.map((screen) => screen.count)))
  const cell = (n, screenId, attrs) => `<td><button type="button" class="cmap-cell" data-n="${n || 0}" data-cmap-screen="${escapeHtml(screenId)}" ${attrs} style="--heat:${Math.sqrt((n || 0) / max)}">${n === null ? "…" : n || "·"}</button></td>`
  const rows = [...stats].sort((a, b) => b.used - a.used || a.part.order - b.part.order).map((row) => `
    <tr${pick?.kind === "part" && pick.name === row.part.name ? ' class="picked"' : ""}>
      <th><code>${escapeHtml(row.part.tag)}</code><span class="cmap-kind ${row.part.shadcn ? "shadcn" : "custom"}">${row.part.shadcn ? escapeHtml(row.part.shadcn) : "custom"}</span></th>
      ${row.perScreen.map((n, i) => cell(n, screens[i].id, `data-cmap-part="${escapeHtml(row.part.name)}"`)).join("")}
      <td class="cmap-total">${row.used} of ${screens.length}</td></tr>`)
  const repeatRows = repeats.map((item) => {
    const counts = screens.map((screen) => item.screens.find((seen) => seen.screenId === screen.id)?.count ?? 0)
    return `<tr class="is-repeat"><th><span class="cmap-repeat-name">“${escapeHtml(item.sample.split(" ").slice(0, 4).join(" "))}…”</span><span class="cmap-kind repeat">not listed</span></th>
      ${counts.map((n, i) => cell(n, screens[i].id, `data-cmap-repeat="${escapeHtml(item.signature)}"`)).join("")}
      <td class="cmap-total">${item.screens.length} of ${screens.length}</td></tr>`
  })
  return `<thead><tr><th></th>${screens.map((screen) => `<th>${escapeHtml(screen.label)}</th>`).join("")}<th>Screens</th></tr></thead>
    <tbody>${rows.join("")}${repeatRows.length ? `<tr class="cmap-divider"><th colspan="${screens.length + 2}">Not listed yet</th></tr>${repeatRows.join("")}` : ""}</tbody>`
}

// A live, cropped view of one element: the screen in a frame, moved and scaled so the
// element sits centered in the box. layoutCrops sets the numbers once the box has a size.
function crop(src, rect, pageSize) {
  return `<div class="cmap-crop" data-rect="${rect.x},${rect.y},${rect.w},${rect.h}" data-page="${pageSize.width},${pageSize.height}">
    <iframe src="${escapeHtml(src)}" loading="lazy" tabindex="-1" aria-hidden="true" title=""></iframe><span class="cmap-crop-frame"></span></div>`
}

export function layoutCrops(root) {
  for (const box of root.querySelectorAll(".cmap-crop")) {
    const [x, y, w, h] = box.dataset.rect.split(",").map(Number)
    const [pageWidth, pageHeight] = box.dataset.page.split(",").map(Number)
    const room = box.getBoundingClientRect()
    if (!room.width || !w || !h) continue
    const scale = Math.min(1, (room.width - 2 * CROP_PAD) / w, (room.height - 2 * CROP_PAD) / h)
    const frame = box.querySelector("iframe")
    frame.style.width = `${pageWidth}px`
    frame.style.height = `${Math.max(pageHeight, y + h + CROP_PAD)}px`
    frame.style.transform = `translate(${(room.width - w * scale) / 2 - x * scale}px, ${(room.height - h * scale) / 2 - y * scale}px) scale(${scale})`
    // Dim what surrounds the part, so the part reads first and its context second.
    Object.assign(box.querySelector(".cmap-crop-frame").style, { left: `${(room.width - w * scale) / 2}px`, top: `${(room.height - h * scale) / 2}px`, width: `${w * scale}px`, height: `${h * scale}px` })
  }
}
