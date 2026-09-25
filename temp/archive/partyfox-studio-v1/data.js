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

  // Animator screens (my-parties, my-leave, my-pay) show Мая's own view.
  me: "maya",

  // Order inbox: site orders, newest first. Every order came from the site form.
  // state: new · needs-info (address missing, warning) · clash (no free animator, warning) · scheduled
  orders: [
    { id: "o1048", received: "днес, 08:42", parent: "Ралица Петкова", phone: "0888 104 812",
      child: "Боби", age: 6, date: "съб, 11 окт.", time: "11:00", package: "Динозаври", guests: 12,
      address: 'ж.к. Лозенец, ул. "Кораб планина" 7', note: "Алергия към ядки — без торта с лешници.",
      customer: "c1", state: "new" },
    { id: "o1047", received: "днес, 07:15", parent: "Мартин Иванов", phone: "0877 318 220",
      child: "Виктория", age: 7, date: "нед, 12 окт.", time: "15:00", package: "Принцеси", guests: 45,
      address: 'Ресторант „Градина“, бул. "България" 51, зала 2', note: "Голямо парти — вероятно трябват двама аниматори.",
      customer: "c4", state: "new", large: true },
    { id: "o1046", received: "вчера, 21:03", parent: "Десислава Колева", phone: "0898 551 067",
      child: "Калоян", age: 5, date: "съб, 4 окт.", time: "16:00", package: "Пирати", guests: 15,
      address: null, note: "Адреса ще го пратя по-късно.", customer: null, state: "needs-info" },
    { id: "o1045", received: "вчера, 18:40", parent: "Ина Стоянова", phone: "0885 902 334",
      child: "Теодор", age: 8, date: "съб, 4 окт.", time: "16:00", package: "Наука", guests: 18,
      address: 'кв. Драгалевци, ул. "Папрат" 12', note: "",
      customer: "c2", state: "clash", clashNote: "По това време има вече две партита. Свободен е само Симо." },
    { id: "o1044", received: "чет, 25 септ.", parent: "Георги Николов", phone: "0879 640 118",
      child: "Ния", age: 4, date: "нед, 5 окт.", time: "10:30", package: "Балони", guests: 10,
      address: 'ул. "Шипка" 34, ет. 5', note: "", customer: "c3", state: "scheduled", animator: "maya" },
  ],

  // Booking screen: one booking from order to pay. It is Софи's party, the one without a deposit.
  // step state: done · missing (the deposit, solid red) · next · todo
  booking: {
    id: "b5", order: "o1031", customer: "c5", parent: "Елена Димова", phone: "0887 225 419",
    email: "elena.dimova@example.com", guests: 14,
    addressNote: "Вход откъм двора, звънец „Димови“.",
    steps: [
      { label: "Поръчка от сайта", state: "done", when: "12 септ., 19:20" },
      { label: "Насрочено", state: "done", when: "13 септ." },
      { label: "Аниматор: Мая", state: "done", when: "13 септ." },
      { label: "Съобщение до родителя", state: "done", when: "14 септ." },
      { label: "Външни доставчици", state: "done", when: "20 септ." },
      { label: "Депозит", state: "missing", when: null },
      { label: "Денят на партито", state: "next", when: "днес, 16:00" },
      { label: "Обратна връзка", state: "todo", when: null },
      { label: "Заплащане на аниматора", state: "todo", when: null },
    ],
    providers: [
      { what: "Балони и арка", who: "Балон Арт", state: "Потвърдено" },
      { what: "Торта", who: "Родителите", state: "Не е от нас" },
    ],
    messages: [
      { when: "14 септ., 10:05", channel: "Viber",
        text: "Здравейте! Потвърждаваме партито на Софи в събота, 27 септември, от 16:00. Аниматор ще е Мая." },
      { when: "24 септ., 12:30", channel: "Имейл",
        text: "Напомняне: депозитът за партито още не е получен." },
    ],
    depositNote: "Сумата на депозита не е зададена.",
  },

  // Leave. The owner approves; an animator asks. Leave that leaves a party without cover is warning amber.
  // state: pending · approved · declined
  leaveRequests: [
    { id: "l1", animator: "maya", from: "пет, 3 окт.", to: "нед, 5 окт.", days: 3, reason: "Семейно пътуване",
      sent: "днес, 09:10", state: "pending",
      cover: [{ booking: "Ния, 4 г. · Балони", when: "нед, 5 окт., 10:30" }] },
    { id: "l2", animator: "simo", from: "пон, 13 окт.", to: "пон, 13 окт.", days: 1, reason: "Изпит в университета",
      sent: "вчера, 17:48", state: "pending", cover: [] },
    { id: "l3", animator: "ivan", from: "съб, 4 окт.", to: "съб, 4 окт.", days: 1, reason: "Сватба на приятел",
      sent: "22 септ.", state: "declined", cover: [], ownerNote: "На 4 окт. има четири партита, а Иван е единственият фокусник." },
    { id: "l4", animator: "ema", from: "съб, 18 окт.", to: "нед, 19 окт.", days: 2, reason: "",
      sent: "20 септ.", state: "approved", cover: [] },
    { id: "l5", animator: "maya", from: "съб, 27 септ.", to: "съб, 27 септ.", hours: "12:00–15:00", days: null,
      reason: "Час при лекар", sent: "15 септ.", state: "approved", cover: [] },
  ],

  // Customers: history, repeat families, large orders, upcoming birthdays.
  // tags: repeat (3+ parties) · large (30+ guests) · new
  customers: [
    { id: "c1", family: "Петкови", parent: "Ралица Петкова", phone: "0888 104 812", tags: ["repeat"],
      children: [{ name: "Боби", birthday: "14 окт." }, { name: "Лия", birthday: "2 март" }],
      history: [
        { date: "март 2025", child: "Лия", package: "Балони", guests: 11 },
        { date: "окт. 2024", child: "Боби", package: "Пирати", guests: 16 },
        { date: "окт. 2023", child: "Боби", package: "Супергерои", guests: 14 },
      ], open: "o1048" },
    { id: "c2", family: "Стоянови", parent: "Ина Стоянова", phone: "0885 902 334", tags: [],
      children: [{ name: "Теодор", birthday: "6 окт." }],
      history: [{ date: "окт. 2024", child: "Теодор", package: "Фокуси", guests: 20 }], open: "o1045" },
    { id: "c3", family: "Николови", parent: "Георги Николов", phone: "0879 640 118", tags: ["new"],
      children: [{ name: "Ния", birthday: "5 окт." }], history: [], open: "o1044" },
    { id: "c4", family: "Иванови", parent: "Мартин Иванов", phone: "0877 318 220", tags: ["repeat", "large"],
      children: [{ name: "Виктория", birthday: "12 окт." }, { name: "Андрей", birthday: "3 юни" }],
      history: [
        { date: "юни 2025", child: "Андрей", package: "Гейминг", guests: 38 },
        { date: "окт. 2024", child: "Виктория", package: "Принцеси", guests: 42 },
        { date: "юни 2024", child: "Андрей", package: "Наука", guests: 30 },
        { date: "окт. 2023", child: "Виктория", package: "Балони", guests: 25 },
      ], open: "o1047" },
    { id: "c5", family: "Димови", parent: "Елена Димова", phone: "0887 225 419", tags: ["repeat"],
      children: [{ name: "Софи", birthday: "27 септ." }],
      history: [
        { date: "днес", child: "Софи", package: "Балони", guests: 14, depositMissing: true },
        { date: "септ. 2024", child: "Софи", package: "Принцеси", guests: 12 },
        { date: "септ. 2023", child: "Софи", package: "Балони", guests: 9 },
      ], open: null },
    { id: "c6", family: "Георгиеви", parent: "Петя Георгиева", phone: "0896 330 471", tags: [],
      children: [{ name: "Гергана", birthday: "30 септ." }],
      history: [
        { date: "днес", child: "Гергана", package: "Фокуси", guests: 16 },
        { date: "септ. 2024", child: "Гергана", package: "Балони", guests: 12 },
      ], open: null },
    { id: "c7", family: "Маринови", parent: "Цветелина Маринова", phone: "0884 719 205", tags: [],
      children: [{ name: "Лъчезар", birthday: "19 окт." }],
      history: [{ date: "окт. 2024", child: "Лъчезар", package: "Пирати", guests: 18 }], open: null },
  ],

  // Birthdays in the next 30 days. booked names the order or booking, null means nobody has asked yet.
  birthdays: [
    { child: "Гергана", customer: "c6", date: "вт, 30 септ.", turns: 7, booked: "b3" },
    { child: "Ния", customer: "c3", date: "нед, 5 окт.", turns: 4, booked: "o1044" },
    { child: "Теодор", customer: "c2", date: "пон, 6 окт.", turns: 8, booked: "o1045" },
    { child: "Виктория", customer: "c4", date: "нед, 12 окт.", turns: 7, booked: "o1047" },
    { child: "Боби", customer: "c1", date: "вт, 14 окт.", turns: 6, booked: "o1048" },
    { child: "Лъчезар", customer: "c7", date: "нед, 19 окт.", turns: 6, booked: null },
  ],

  // Мая's own parties, next ten days. Ния's party falls inside her pending leave.
  myParties: [
    { id: "b5", date: "днес, съб 27 септ.", start: "16:00", end: "18:00", child: "Софи", age: 4, package: "Балони",
      guests: 14, address: 'ул. "Оборище" 21, София', addressNote: "Вход откъм двора, звънец „Димови“.",
      parent: "Елена Димова", phone: "0887 225 419", deposit: false },
    { id: "b7", date: "нед, 28 септ.", start: "11:00", end: "13:00", child: "Мирослав", age: 6, package: "Супергерои",
      guests: 16, address: "ж.к. Люлин 5, бл. 512, вх. Б, ет. 7", addressNote: "Асансьорът е до 6-ия етаж.",
      parent: "Невена Русева", phone: "0876 402 118", deposit: true },
    { id: "b8", date: "ср, 1 окт.", start: "17:00", end: "19:00", child: "Катя", age: 5, package: "Лицева рисунка",
      guests: 9, address: 'ул. "Гурко" 9, ет. 2', addressNote: "",
      parent: "Бояна Христова", phone: "0889 517 640", deposit: true },
    { id: "b9", date: "нед, 5 окт.", start: "10:30", end: "12:30", child: "Ния", age: 4, package: "Балони",
      guests: 10, address: 'ул. "Шипка" 34, ет. 5', addressNote: "",
      parent: "Георги Николов", phone: "0879 640 118", deposit: true, inLeave: "l1" },
  ],

  // Мая's pay for the month. The animator cut and bonus formula are unknown, so every amount is null (unset).
  myPay: {
    month: "септември 2025",
    parties: [
      { date: "6 септ.", child: "Рая", package: "Балони", hours: 2, state: "done" },
      { date: "7 септ.", child: "Иво", package: "Лицева рисунка", hours: 2, state: "done" },
      { date: "13 септ.", child: "Мила", package: "Балони", hours: 2, state: "done" },
      { date: "14 септ.", child: "Сияна", package: "Принцеси", hours: 3, state: "done" },
      { date: "20 септ.", child: "Дани", package: "Лицева рисунка", hours: 2, state: "done" },
      { date: "21 септ.", child: "Борис", package: "Пирати", hours: 2, state: "done" },
      { date: "27 септ.", child: "Софи", package: "Балони", hours: 2, state: "today", depositMissing: true },
      { date: "28 септ.", child: "Мирослав", package: "Супергерои", hours: 2, state: "upcoming" },
    ],
    amount: null, bonus: null,
    unsetNote: "Дялът на аниматора и бонусите още не са зададени.",
    check: "Собственикът проверява заплащането в края на месеца.",
  },
};
