// Direction: TABLE — a who-by-when ledger sheet. Rows are hours, columns are
// people. You read across a row to see who is free. No cards, no board.

const WARN_TEXT = "Deposit missing. Call and ask."

const bookings = {
  leo: { child: "Leo, 3", character: "Pirate", address: "8 Vitosha Blvd" },
  mia: { child: "Mia, 6", character: "Elsa", address: "12 Cherni Vrah, Lozenets", depositMissing: true },
  sara: { child: "Sara, 8", character: "Witch", address: "44 Shipka St" },
}

// One row per hour. Each column lists the bookings that fill that hour cell
// for that person — the same booking appears again as a quiet "continuing"
// entry in every hour it covers, so a double booking shows as two entries
// stacked in one cell instead of a table structure that can't represent it.
const hourGrid = [
  { hour: "11:00", ivan: [], petar: [{ key: "leo", start: true }], elena: [] },
  { hour: "12:00", ivan: [], petar: [{ key: "leo", start: false }], elena: [] },
  { hour: "13:00", ivan: [], petar: [], elena: [] },
  { hour: "14:00", ivan: [{ key: "mia", start: true }], petar: [], elena: [] },
  {
    hour: "15:00",
    ivan: [{ key: "mia", start: false }, { key: "sara", start: true }],
    petar: [],
    elena: [],
    clash: "Double-booked",
  },
  {
    hour: "16:00",
    ivan: [{ key: "mia", start: false }, { key: "sara", start: false }],
    petar: [],
    elena: [],
  },
  { hour: "17:00", ivan: [{ key: "sara", start: false }], petar: [], elena: [] },
]

function unset() {
  return `<span class="table-unset">Not set</span>`
}

// One head for every screen: wordmark, what you are looking at, one line of
// plain context. The action, when there is one, sits on the same baseline.
function sheetHead(heading, note, action = "") {
  return `<header class="table-bar">
    <div class="table-bar-info">
      <span class="table-mark">PartyFox</span>
      <h2>${heading}</h2>
      <p>${note}</p>
    </div>
    ${action}
  </header>`
}

function entryMarkup(entry) {
  const booking = bookings[entry.key]
  if (entry.start) {
    return `<div class="table-entry is-start">
      <span class="table-entry-name">${booking.child}</span>
      <span class="table-entry-address">${booking.address}</span>
      <span class="table-entry-role">${booking.character}</span>
      ${booking.depositMissing ? `<span class="table-warn">${WARN_TEXT}</span>` : ""}
    </div>`
  }
  return `<div class="table-entry is-continue">
    <span class="table-entry-name">${booking.child}</span>
    <span class="table-sr-only">continues this hour</span>
  </div>`
}

function hourCell(entries, clash) {
  if (!entries.length) return `<td class="table-cell"><span class="table-sr-only">Free</span></td>`
  const double = entries.length > 1
  return `<td class="table-cell${double ? " is-double" : ""}">
    ${clash ? `<p class="table-clash">${clash}</p>` : ""}
    ${entries.map(entryMarkup).join("")}
  </td>`
}

function gridTable() {
  const rows = hourGrid.map((row) => `<tr>
    <th scope="row">${row.hour}</th>
    ${hourCell(row.ivan, row.clash)}
    ${hourCell(row.petar)}
    ${hourCell(row.elena)}
  </tr>`).join("")

  return `<table class="table-grid">
    <caption class="table-sr-only">Bookings by hour and animator, Saturday 27 September</caption>
    <thead>
      <tr>
        <th scope="col" class="table-hour-head">Hour</th>
        <th scope="col" class="table-person"><span class="table-person-name">Ivan</span><span class="table-person-note">2 bookings, one clash</span></th>
        <th scope="col" class="table-person"><span class="table-person-name">Petar</span><span class="table-person-note">1 booking</span></th>
        <th scope="col" class="table-person"><span class="table-person-name">Elena</span><span class="table-person-note">Free all day</span></th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function stackEntry(entry) {
  return `<div class="table-stack-entry">
    <span class="table-stack-time">${entry.time}</span>
    <span class="table-stack-address">${entry.address}</span>
    <span class="table-entry-name">${entry.child}</span>
    <span class="table-entry-role">${entry.character}</span>
    ${entry.depositMissing ? `<span class="table-warn">${WARN_TEXT}</span>` : ""}
    ${entry.clash ? `<span class="table-clash">${entry.clash}</span>` : ""}
  </div>`
}

function stackBlock(name, note, tone, entries) {
  const body = entries.length
    ? entries.map(stackEntry).join("")
    : `<p class="table-stack-empty">Free all day</p>`
  return `<div class="table-stack-block is-${tone}">
    <div class="table-stack-head">
      <h3>${name}</h3>
      <p class="table-stack-note">${note}</p>
    </div>
    ${body}
  </div>`
}

// Phone equivalent of the same facts: one labeled block per animator instead
// of a squeezed four-column table. Shown only under the narrow container.
function stackView() {
  return `<div class="table-stack">
    ${stackBlock("Ivan", "2 bookings, one clash", "one", [
      { time: "14:00–16:30", child: "Mia, 6", character: "Elsa", address: "12 Cherni Vrah, Lozenets", depositMissing: true, clash: "Overlaps Sara from 15:00." },
      { time: "15:00–17:30", child: "Sara, 8", character: "Witch", address: "44 Shipka St", clash: "Overlaps Mia until 16:30." },
    ])}
    ${stackBlock("Petar", "1 booking", "two", [
      { time: "11:00–13:00", child: "Leo, 3", character: "Pirate", address: "8 Vitosha Blvd" },
    ])}
    ${stackBlock("Elena", "Free all day", "three", [])}
  </div>`
}

export function calendar() {
  return `<div class="app-content table-calendar">
    ${sheetHead(
      "Saturday, 27 September",
      "3 bookings today. Ivan is double-booked at 15:00.",
      `<button class="table-add" type="button">Add booking</button>`,
    )}
    <div class="table-sheet">
      ${gridTable()}
      ${stackView()}
      <p class="table-legend">Shaded hours hold two parties at once. Empty cells are free.</p>
    </div>
  </div>`
}

export function booking() {
  return `<div class="app-content table-booking">
    ${sheetHead("Mia, 6", "Elsa, Saturday 27 September, 14:00–16:30, with Ivan")}
    <div class="table-sheet is-narrow">
      <table class="table-form">
        <caption class="table-sr-only">Booking details for Mia, 6</caption>
        <tbody>
          <tr><th scope="row">Child</th><td>Mia, 6</td></tr>
          <tr><th scope="row">Character</th><td>Elsa</td></tr>
          <tr><th scope="row">Date</th><td>Saturday, 27 September</td></tr>
          <tr><th scope="row">Time</th><td>14:00–16:30</td></tr>
          <tr><th scope="row">Animator</th><td>Ivan</td></tr>
          <tr><th scope="row">Address</th><td class="table-form-address">12 Cherni Vrah, Lozenets</td></tr>
          <tr><th scope="row">Guests</th><td>12 children</td></tr>
          <tr><th scope="row">Package</th><td>Classic</td></tr>
          <tr><th scope="row">Price</th><td>€240</td></tr>
          <tr><th scope="row">Animator share</th><td>${unset()}</td></tr>
          <tr><th scope="row">Deposit rule</th><td>${unset()}</td></tr>
          <tr class="is-warn">
            <th scope="row">Deposit received</th>
            <td>
              <span class="table-form-value">Not verified</span>
              <span class="table-warn">${WARN_TEXT}</span>
              <button class="table-deposit-button" type="button">Mark deposit received</button>
            </td>
          </tr>
          <tr class="is-private">
            <th scope="row">Family note</th>
            <td><span class="table-tag">Owner only</span>Speak with the parent before photos. Pickup stays private.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`
}

export function animator() {
  return `<div class="app-content table-animator">
    ${sheetHead("Ivan", "Saturday, 27 September")}
    <div class="table-sheet is-narrow">
      <table class="table-animator-grid">
        <caption class="table-sr-only">Ivan's parties, Saturday 27 September</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Child</th>
            <th scope="col">Address</th>
            <th scope="col" class="table-animator-share">Your share</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="table-animator-time">14:00–16:30</td>
            <td><span class="table-entry-name">Mia, 6</span><span class="table-entry-role">Elsa</span></td>
            <td class="table-animator-address">12 Cherni Vrah, Lozenets</td>
            <td class="table-animator-share">${unset()}</td>
          </tr>
          <tr class="table-animator-notes">
            <td colspan="4">
              <span class="table-warn">${WARN_TEXT}</span>
              <span class="table-clash">Overlaps Sara from 15:00.</span>
            </td>
          </tr>
          <tr>
            <td class="table-animator-time">15:00–17:30</td>
            <td><span class="table-entry-name">Sara, 8</span><span class="table-entry-role">Witch</span></td>
            <td class="table-animator-address">44 Shipka St</td>
            <td class="table-animator-share">${unset()}</td>
          </tr>
          <tr class="table-animator-notes">
            <td colspan="4"><span class="table-clash">Overlaps Mia until 16:30.</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`
}
