export function calendar() {
  return `<div class="app-content desk-calendar">
  <header class="desk-top">
    <span class="desk-brand">PartyFox</span>
    <p class="desk-date">Sat 27 Sep</p>
  </header>

  <section class="desk-decisions" aria-labelledby="desk-decisions-title">
    <h2 id="desk-decisions-title" class="desk-section-title">Needs a decision</h2>
    <ul class="desk-decision-list">
      <li class="desk-decision desk-decision-warn">
        <p class="desk-decision-lead">Mia’s missing deposit</p>
        <p class="desk-warn" role="status">Deposit missing. Call and ask.</p>
      </li>
      <li class="desk-decision">
        <p class="desk-decision-lead">Ivan booked on Mia and Sara at the same time (15:00–16:30)</p>
      </li>
    </ul>
  </section>

  <section class="desk-day" aria-labelledby="desk-day-title">
    <h2 id="desk-day-title" class="desk-section-title">Parties today</h2>
    <ul class="desk-party-list">
      <li class="desk-party">
        <time class="desk-party-time" datetime="11:00">11:00–13:00</time>
        <div class="desk-party-main">
          <strong class="desk-party-who">Leo, 3</strong>
          <span class="desk-party-meta">Pirate, Petar, 8 Vitosha Blvd</span>
          <span class="desk-party-status">Deposit received</span>
        </div>
      </li>
      <li class="desk-party desk-party-alert">
        <time class="desk-party-time" datetime="14:00">14:00–16:30</time>
        <div class="desk-party-main">
          <strong class="desk-party-who">Mia, 6</strong>
          <span class="desk-party-meta">Elsa, Ivan, 12 Cherni Vrah, Lozenets</span>
          <p class="desk-warn" role="status">Deposit missing. Call and ask.</p>
        </div>
      </li>
      <li class="desk-party">
        <time class="desk-party-time" datetime="15:00">15:00–17:30</time>
        <div class="desk-party-main">
          <strong class="desk-party-who">Sara, 8</strong>
          <span class="desk-party-meta">Witch, Ivan, 44 Shipka St</span>
          <span class="desk-party-status">Deposit received. Overlaps Mia.</span>
        </div>
      </li>
      <li class="desk-party desk-party-free">
        <span class="desk-party-time">Elena</span>
        <div class="desk-party-main">
          <strong class="desk-party-who">Free</strong>
          <span class="desk-party-meta">No parties assigned</span>
        </div>
      </li>
    </ul>
  </section>
</div>`
}

export function booking() {
  return `<div class="app-content desk-booking">
  <header class="desk-top">
    <span class="desk-brand">PartyFox</span>
    <p class="desk-date">Sat 27 Sep, booking</p>
  </header>

  <section class="desk-decisions" aria-labelledby="desk-booking-do">
    <h2 id="desk-booking-do" class="desk-section-title">Needs a decision</h2>
    <div class="desk-decision desk-decision-warn" role="status">
      <p class="desk-decision-lead">Mia’s missing deposit</p>
      <p class="desk-warn">Deposit missing. Call and ask.</p>
    </div>
  </section>

  <div class="desk-booking-head">
    <h2 class="desk-booking-title">Mia, 6</h2>
    <p class="desk-booking-sub">Elsa, Ivan, 14:00–16:30</p>
  </div>

  <p class="desk-address">12 Cherni Vrah, Lozenets</p>

  <dl class="desk-facts">
    <div><dt>Guests</dt><dd>12 children</dd></div>
    <div><dt>Package</dt><dd>Classic</dd></div>
    <div><dt>Total</dt><dd>€240</dd></div>
    <div><dt>Animator share</dt><dd>Not set</dd></div>
    <div><dt>Deposit rule</dt><dd>Not set</dd></div>
    <div><dt>Received</dt><dd>Not verified</dd></div>
  </dl>

  <button class="desk-action" type="button">Mark deposit received</button>

  <aside class="desk-note">
    <h3 class="desk-note-title">Family note</h3>
    <p>Speak with parent before photos. Pickup stays private.</p>
  </aside>
</div>`
}

export function animator() {
  return `<div class="app-content desk-animator">
  <header class="desk-top">
    <span class="desk-brand">PartyFox</span>
    <p class="desk-date">Sat 27 Sep, Ivan</p>
  </header>

  <section class="desk-decisions" aria-labelledby="desk-ivan-do">
    <h2 id="desk-ivan-do" class="desk-section-title">Needs a decision</h2>
    <ul class="desk-decision-list">
      <li class="desk-decision desk-decision-warn">
        <p class="desk-decision-lead">Mia’s missing deposit</p>
        <p class="desk-warn" role="status">Deposit missing. Call and ask.</p>
      </li>
      <li class="desk-decision">
        <p class="desk-decision-lead">Ivan booked on Mia and Sara at the same time (15:00–16:30)</p>
      </li>
    </ul>
  </section>

  <section class="desk-runs" aria-labelledby="desk-ivan-parties">
    <h2 id="desk-ivan-parties" class="desk-section-title">Your parties</h2>

    <article class="desk-run">
      <p class="desk-run-time">14:00–16:30, Mia, 6, Elsa</p>
      <p class="desk-address">12 Cherni Vrah, Lozenets</p>
      <p class="desk-warn" role="status">Deposit missing. Call and ask.</p>
      <p class="desk-share"><span>Your share</span><b>Not set</b></p>
    </article>

    <article class="desk-run">
      <p class="desk-run-time">15:00–17:30, Sara, 8, Witch</p>
      <p class="desk-address">44 Shipka St</p>
      <p class="desk-run-note">Overlaps Mia 15:00–16:30</p>
      <p class="desk-share"><span>Your share</span><b>Not set</b></p>
    </article>
  </section>
</div>`
}
