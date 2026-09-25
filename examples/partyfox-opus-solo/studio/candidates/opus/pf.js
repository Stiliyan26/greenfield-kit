// PartyFox, Opus variant: shared helpers and the app shell. Reads window.PARTYFOX only.
(() => {
  const D = window.PARTYFOX
  const MONTHS = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"]
  const MON = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"]
  const DAYS = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"]
  const DAYS_SHORT = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"]

  const esc = (value) => String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
  const parse = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)) }
  const iso = (date) => date.toISOString().slice(0, 10)
  const addDays = (value, n) => { const d = parse(value); d.setUTCDate(d.getUTCDate() + n); return iso(d) }
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5)
  const fromToday = (value) => diff(D.today, value)

  const date = {
    weekday: (v) => DAYS[parse(v).getUTCDay()],
    wd: (v) => DAYS_SHORT[parse(v).getUTCDay()],
    day: (v) => parse(v).getUTCDate(),
    mon: (v) => MON[parse(v).getUTCMonth()],
    month: (v) => MONTHS[parse(v).getUTCMonth()],
    long: (v) => { const d = parse(v); return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` },
    short: (v) => { const d = parse(v); return `${DAYS_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MON[d.getUTCMonth()]}` },
    dm: (v) => { const d = parse(v); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}` },
    full: (v) => { const d = parse(v); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` },
    rel: (v) => {
      const n = fromToday(v)
      if (n === 0) return "днес"
      if (n === 1) return "утре"
      if (n === -1) return "вчера"
      if (n > 1) return `след ${n} дни`
      return `преди ${-n} дни`
    },
    range: (a, b) => {
      if (a === b) return date.dm(a)
      const x = parse(a), y = parse(b)
      return x.getUTCMonth() === y.getUTCMonth() ? `${x.getUTCDate()}–${y.getUTCDate()} ${MON[y.getUTCMonth()]}` : `${date.dm(a)} – ${date.dm(b)}`
    },
    stamp: (value) => {
      const [d, t] = value.split("T")
      const n = fromToday(d)
      return `${n === 0 ? "днес" : n === -1 ? "вчера" : date.dm(d)}, ${t}`
    },
  }

  const byId = (list, id) => list.find((item) => item.id === id)
  const animator = (id) => byId(D.animators, id)
  const customer = (id) => byId(D.customers, id)
  const booking = (id) => byId(D.bookings, id)
  const initials = (name) => name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("")
  const hours = (n) => String(n).replace(".", ",")
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

  // Program monogram: first letter, one of three calm tints.
  const PROGRAM_TINT = { "Принцеси": "p1", "Ледено кралство": "p2", "Научно шоу": "p2", "Супергерои": "p1", "Пирати": "p3", "Детективи": "p3", "Футбол": "p2", "Балони": "p1", "Фейс арт": "p3" }
  const prog = (name) => `<span class="prog ${PROGRAM_TINT[name] || "p3"}" aria-hidden="true">${esc(name[0])}</span>`

  // Leave that covers a booking, taken from each leave's own conflicts list.
  const leaveFor = (bookingId) => D.leave.filter((item) => item.status !== "rejected" && item.conflicts.includes(bookingId))

  // Everything a booking needs attention for. Only a missing deposit is danger.
  function issues(b) {
    const list = []
    if (b.deposit.status === "missing") list.push({ kind: "danger", key: "deposit", label: "Няма капаро", detail: b.stage === "done" ? "Партито мина, капарото не е отбелязано." : "" })
    if (!b.animators.length) list.push({ kind: "warning", key: "unassigned", label: "Без аниматор", detail: "Никой не е поставен на това парти." })
    if (b.clash) list.push({ kind: "warning", key: "clash", label: "Застъпване", detail: b.clash.note })
    if (!b.address.usable) list.push({ kind: "warning", key: "address", label: "Непълен адрес", detail: b.address.notes })
    for (const item of leaveFor(b.id)) {
      const who = animator(item.animatorId).short
      list.push({ kind: "warning", key: "leave", label: item.status === "pending" ? `${who} иска отпуска` : `${who} е в отпуска`, detail: `Отпуска ${date.range(item.from, item.to)}, ${item.status === "pending" ? "чака решение" : "одобрена"}.` })
    }
    return list
  }
  const statusOf = (b) => { const list = issues(b); return list.some((i) => i.kind === "danger") ? "danger" : list.length ? "warning" : "ok" }

  const ICONS = {
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.01"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
    cake: '<path d="M4 21h16v-8H4zM4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0"/><path d="M12 13V9M12 6.5c-1 0-1.5-.8-1.5-1.5S12 3 12 3s1.5 1.3 1.5 2-.5 1.5-1.5 1.5z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    note: '<path d="M5 4h14v16H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"/>',
    door: '<path d="M6 21V3h12v18"/><path d="M3 21h18M14 12v.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    repeat: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
  }
  const icon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`
  const tag = (kind, text, ic) => `<span class="tag ${kind}">${ic ? icon(ic) : ""}${esc(text)}</span>`
  const unset = (text = "не е зададено") => `<span class="unset" title="Сумата не е уточнена от собственика">${esc(text)}</span>`
  const dateTile = (value) => `<span class="date-tile${value === D.today ? " today" : ""}" aria-label="${esc(date.long(value))}"><b>${date.mon(value)}</b><span>${date.day(value)}</span></span>`
  const avatar = (id, cls = "") => { const a = animator(id); return `<span class="avatar ${cls}" title="${esc(a.name)}">${esc(initials(a.name))}</span>` }
  const chip = (id) => { const a = animator(id); return `<span class="chip" data-animator="${a.id}"><span class="avatar">${esc(initials(a.name))}</span>${esc(a.short)}</span>` }

  const FOX = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M3 3l8 7h10l8-7-1.5 13L16 29 4.5 16z"/><path style="fill: var(--color-surface)" d="M9.5 15.5 13 17l-2.5 1.5zM22.5 15.5 19 17l2.5 1.5zM14 23h4l-2 2.2z"/></svg>'

  const NAV = {
    owner: [
      { id: "inbox", long: "Заявки от сайта", short: "Заявки", count: () => D.orders.filter((o) => o.status === "new").length, kind: "warning" },
      { id: "bookings", long: "Партита и капаро", short: "Партита", count: () => D.bookings.filter((b) => b.deposit.status === "missing").length, kind: "danger" },
      { id: "leave-requests", long: "Отпуски", short: "Отпуски", count: () => D.leave.filter((l) => l.status === "pending").length, kind: "" },
      { id: "customers", long: "Клиенти", short: "Клиенти" },
    ],
    animator: [
      { id: "my-parties", long: "Моите партита", short: "Партита" },
      { id: "my-leave", long: "Отпуска", short: "Отпуска" },
      { id: "my-pay", long: "Заплащане", short: "Заплащане" },
    ],
  }

  function shell(role, active) {
    const me = role === "owner" ? { name: D.owner.name, role: "Собственик" } : { name: animator(D.currentAnimator).name, role: "Аниматор" }
    const nav = NAV[role].map((item) => {
      const n = item.count ? item.count() : 0
      return `<a href="./${item.id}.html${location.search}" data-nav="${item.id}"${item.id === active ? ' aria-current="page"' : ""}>`
        + `<span class="label-long">${esc(item.long)}</span><span class="label-short">${esc(item.short)}</span>`
        + (n ? `<span class="count ${item.kind}">${n}</span>` : "") + "</a>"
    }).join("")
    const header = document.createElement("header")
    header.className = "topbar"
    header.dataset.shell = role
    header.innerHTML = `<a class="brand" href="./${NAV[role][0].id}.html${location.search}">${FOX}PartyFox<small>${role === "owner" ? "офис" : "аниматор"}</small></a>`
      + `<nav class="nav" aria-label="Основно меню">${nav}</nav>`
      + `<div class="topbar-end"><div class="today" data-today="${D.today}">${esc(date.weekday(D.today)[0].toUpperCase() + date.weekday(D.today).slice(1))}, ${date.day(D.today)} ${date.month(D.today)}<span>днес</span></div>`
      + `<div class="who"><span class="avatar">${esc(initials(me.name))}</span><div>${esc(me.name)}<em>${me.role}</em></div></div></div>`
    document.querySelector(".app").prepend(header)
  }

  window.PF = { D, esc, parse, iso, addDays, diff, fromToday, date, animator, customer, booking, initials, hours, plural, prog, issues, statusOf, leaveFor, icon, tag, unset, dateTile, avatar, chip, shell }
})()
