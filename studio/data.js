// PartyFox — shared fake dataset for all design candidates. Bulgarian, fake names.
// Money rules unset per PRODUCT.md — deposit shown as present/missing, never an amount.
// No colors here: candidates take every color from the studio world.
window.PARTYFOX = {
  day: "Събота, 27 септември",
  hours: { start: 9, end: 21 },
  animators: [
    { id: "ema",  name: "Ема",  role: "Клоун / балони" },
    { id: "ivan", name: "Иван", role: "Фокусник" },
    { id: "maya", name: "Мая",  role: "Лицева рисунка" },
    { id: "simo", name: "Симо", role: "Пират / игри" },
  ],
  leave: [
    { animator: "maya", from: 12, to: 15, note: "Отпуск (одобрен) 12:00–15:00" },
  ],
  bookings: [
    {
      id: "b1", start: 10, end: 12, child: "Алекс", age: 6, package: "Пирати",
      address: 'ул. "Райна Княгиня" 14, София', animator: "ema",
      deposit: true, state: "confirmed",
    },
    {
      id: "b2", start: 11, end: 13, child: "Мика", age: 5, package: "Принцеси",
      address: "ж.к. Младост 2, бл. 214", animator: "simo",
      deposit: true, state: "confirmed",
    },
    {
      id: "b3", start: 14, end: 16, child: "Гергана", age: 7, package: "Фокуси",
      address: "ул. \"Цар Иван Асен II\" 88, ет. 3", animator: "ivan",
      deposit: true, state: "confirmed",
    },
    {
      id: "b4", start: 15, end: 17, child: "Давид", age: 8, package: "Наука",
      address: "кв. Бояна, ул. \"Севернa\" 3 — дълъг адрес с бележка за входа",
      animator: "ivan", deposit: true, state: "confirmed", clashWith: "b3",
    },
    {
      id: "b5", start: 16, end: 18, child: "Софи", age: 4, package: "Балони",
      address: "ул. \"Оборище\" 21", animator: "maya",
      deposit: false, state: "confirmed",   // ← the missing-deposit party
    },
    {
      id: "b6", start: 18, end: 20, child: "Никола", age: 9, package: "Гейминг",
      address: "бул. \"Витоша\" 102", animator: null,
      deposit: true, state: "needs-animator",
    },
  ],
  summary: { parties: 6, unassigned: 1, depositsMissing: 1, clashes: 1 },
};
