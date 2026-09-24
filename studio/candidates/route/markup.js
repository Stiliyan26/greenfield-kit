function brand() {
  return `<div class="route-brand"><span class="route-brand-dot" aria-hidden="true"></span>PartyFox</div>`
}

function sheetHead(title, sub, action = "") {
  return `<header class="route-sheet-head">
    ${brand()}
    <div class="route-sheet-title">
      <h2>${title}</h2>
      <p>${sub}</p>
    </div>
    ${action}
  </header>`
}

function depositWarn() {
  return `<p class="route-deposit" role="status">Deposit missing. Call and ask.</p>`
}

function depositOk() {
  return `<p class="route-status-ok">Deposit received</p>`
}

export function calendar() {
  return `<div class="app-content route-calendar">
    ${sheetHead("Sat 27 Sep", "Run sheet, whole day", `<button class="route-btn route-btn-new" type="button">New booking</button>`)}

    <ol class="route-rail" aria-label="Saturday parties in order">
      <li class="route-entry">
        <span class="route-dot" aria-hidden="true"></span>
        <article class="route-ticket">
          <time class="route-time" datetime="11:00">11:00–13:00</time>
          <p class="route-address">8 Vitosha Blvd</p>
          <p class="route-child">Leo, 3</p>
          <p class="route-meta">Pirate character, with Petar</p>
          ${depositOk()}
        </article>
      </li>

      <li class="route-entry route-entry-cluster">
        <span class="route-cluster-mark" aria-hidden="true"></span>
        <div class="route-cluster-body">
          <p class="route-cluster-label">Double-booked, 15:00–16:30</p>

          <article class="route-ticket route-ticket-warn">
            <time class="route-time" datetime="14:00">14:00–16:30</time>
            <p class="route-address">12 Cherni Vrah, Lozenets</p>
            <p class="route-child">Mia, 6</p>
            <p class="route-meta">Elsa character, with Ivan</p>
            ${depositWarn()}
          </article>

          <article class="route-ticket">
            <time class="route-time" datetime="15:00">15:00–17:30</time>
            <p class="route-address">44 Shipka St</p>
            <p class="route-child">Sara, 8</p>
            <p class="route-meta">Witch character, with Ivan</p>
            ${depositOk()}
          </article>
        </div>
      </li>

      <li class="route-entry route-entry-empty">
        <span class="route-dot route-dot-empty" aria-hidden="true"></span>
        <div class="route-empty">
          <p class="route-empty-name">Elena</p>
          <p class="route-empty-note">No parties</p>
        </div>
      </li>
    </ol>
  </div>`
}

export function booking() {
  return `<div class="app-content route-booking">
    ${sheetHead("Mia, 6", "Sat 27 Sep, owner booking")}

    <article class="route-ticket route-ticket-warn route-ticket-hero">
      <time class="route-time" datetime="14:00">14:00–16:30</time>
      <p class="route-address">12 Cherni Vrah, Lozenets</p>
      <p class="route-meta">Elsa character, with Ivan</p>
      ${depositWarn()}
    </article>

    <div class="route-booking-grid">
      <section class="route-card" aria-label="Party details">
        <h3 class="route-card-title">Party details</h3>
        <div class="route-fact"><span>Children</span><strong>12</strong></div>
        <div class="route-fact"><span>Package</span><strong>Classic</strong></div>
        <div class="route-fact"><span>Character</span><strong>Elsa</strong></div>
        <div class="route-fact"><span>Animator</span><strong>Ivan</strong></div>
      </section>

      <section class="route-card" aria-label="Money">
        <h3 class="route-card-title">Money</h3>
        <div class="route-fact"><span>Total</span><strong>€240</strong></div>
        <div class="route-fact"><span>Animator share</span><strong>Not set</strong></div>
        <div class="route-fact"><span>Deposit rule</span><strong>Not set</strong></div>
        <div class="route-fact"><span>Received</span><strong>Not verified</strong></div>
        <button class="route-btn route-btn-confirm" type="button">Mark deposit received</button>
      </section>
    </div>

    <section class="route-card route-note" aria-label="Family note">
      <div class="route-note-head">
        <h3 class="route-card-title">Family note</h3>
        <span class="route-tag">Private</span>
      </div>
      <p>Parent asked to speak with her before sharing photos. Keep pickup private.</p>
    </section>
  </div>`
}

export function animator() {
  return `<div class="app-content route-animator">
    ${sheetHead("Ivan, Sat 27 Sep", "Your run sheet")}

    <ol class="route-rail" aria-label="Ivan's parties in order">
      <li class="route-entry route-entry-cluster">
        <span class="route-cluster-mark" aria-hidden="true"></span>
        <div class="route-cluster-body">
          <p class="route-cluster-label">Double-booked, 15:00–16:30</p>

          <article class="route-ticket route-ticket-warn">
            <time class="route-time" datetime="14:00">14:00–16:30</time>
            <p class="route-address">12 Cherni Vrah, Lozenets</p>
            <p class="route-child">Mia, 6</p>
            <p class="route-meta">Elsa character</p>
            <p class="route-share"><span>Your share</span><strong>Not set</strong></p>
            ${depositWarn()}
          </article>

          <article class="route-ticket">
            <time class="route-time" datetime="15:00">15:00–17:30</time>
            <p class="route-address">44 Shipka St</p>
            <p class="route-child">Sara, 8</p>
            <p class="route-meta">Witch character</p>
            <p class="route-clash-note">Overlaps Mia until 16:30. Call the office.</p>
            <p class="route-share"><span>Your share</span><strong>Not set</strong></p>
          </article>
        </div>
      </li>
    </ol>
  </div>`
}
