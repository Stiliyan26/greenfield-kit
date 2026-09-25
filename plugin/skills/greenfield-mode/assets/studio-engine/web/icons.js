// One icon set, drawn for the studio: 24-unit grid, 1.6 stroke, round joins.
const paths = {
  frame: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 9h16"/>',
  screens: '<rect x="3" y="6" width="5" height="12" rx="1"/><rect x="9.5" y="6" width="5" height="12" rx="1"/><rect x="16" y="6" width="5" height="12" rx="1"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  comment: '<path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  star: '<path d="m12 4 2.4 5 5.4.7-4 3.7 1 5.4L12 16.2 7.2 18.8l1-5.4-4-3.7 5.4-.7Z"/>',
  left: '<path d="m14.5 6-6 6 6 6"/>',
  right: '<path d="m9.5 6 6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  alert: '<path d="M12 4 21 19H3Z"/><path d="M12 10v4"/><path d="M12 16.8v.2"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  fit: '<path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/>',
  reset: '<path d="M5 9a7 7 0 1 1-1 4"/><path d="M5 4v5h5"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="m20 16-4.5-4.5L7 19"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M8 14h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
  panelLeft: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M9 5v14"/>',
  panelRight: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M15 5v14"/>',
  panels: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M8 5v14M16 5v14"/>',
  pencil: '<path d="M15 5l4 4L9 19H5v-4Z"/><path d="m13 7 4 4"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>',
  wand: '<path d="m5 19 10-10"/><path d="m13 7 2-2 4 4-2 2"/><path d="M8 4v2M7 5h2M18 15v2M17 16h2"/>',
  shapes: '<path d="M12 4 16 10H8Z"/><rect x="4" y="13" width="7" height="7" rx="1"/><circle cx="16.5" cy="16.5" r="3.5"/>',
  tag: '<path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8Z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
}

export function icon(name, { filled = false, size = 16, label = "" } = {}) {
  const fill = filled ? "currentColor" : "none"
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${aria}>${paths[name] || ""}</svg>`
}
