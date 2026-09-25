// PartyFox shared fake data. Every variant reads this file; nobody edits it while designing.
// All people, phones, addresses and bookings are invented. Money figures the brief marks
// as unknown (deposit rule, animator cut, bonus formula, package prices) are null: show them as unset.
window.PARTYFOX = {
  today: "2026-09-25", // Friday
  currency: "EUR",
  agency: { name: "PartyFox", city: "София" },
  owner: { id: "owner", name: "Росица Данаилова", short: "Росица" },

  // The animator whose screens (my-parties, my-leave, my-pay) are shown.
  currentAnimator: "a2",

  animators: [
    { id: "a1", name: "Никола Стоянов", short: "Никола", phone: "+359 88 410 2231", programs: ["Научно шоу", "Супергерои", "Детективи"] },
    { id: "a2", name: "Ива Колева", short: "Ива", phone: "+359 87 602 1190", programs: ["Принцеси", "Ледено кралство", "Научно шоу", "Супергерои"] },
    { id: "a3", name: "Теодора Маринова", short: "Теодора", phone: "+359 89 331 7045", programs: ["Пирати", "Принцеси", "Фейс арт"] },
    { id: "a4", name: "Кристиан Петков", short: "Кристиан", phone: "+359 88 905 6612", programs: ["Супергерои", "Футбол", "Пирати"] },
    { id: "a5", name: "Мария-Антоанета Великова-Христова", short: "Мария-Антоанета", phone: "+359 87 118 4420", programs: ["Балони", "Фейс арт", "Принцеси"] },
    { id: "a6", name: "Стефан Драганов", short: "Стефан", phone: "+359 89 774 0038", programs: ["Детективи", "Футбол", "Научно шоу"] }
  ],

  // Party programs PartyFox sells. Prices are not supplied yet.
  programs: [
    { id: "princesses", name: "Принцеси", minutes: 120, price: null },
    { id: "frozen", name: "Ледено кралство", minutes: 120, price: null },
    { id: "science", name: "Научно шоу", minutes: 90, price: null },
    { id: "heroes", name: "Супергерои", minutes: 120, price: null },
    { id: "pirates", name: "Пирати", minutes: 120, price: null },
    { id: "detectives", name: "Детективи", minutes: 120, price: null },
    { id: "football", name: "Футбол", minutes: 120, price: null }
  ],

  // The deposit rule is unknown: how much and by when. Only "received" or "missing" is known.
  rules: {
    depositAmount: null,
    depositDueDaysBefore: null,
    animatorCut: null,
    bonusFormula: null,
    note: "Правилото за капаро, делът на аниматора и бонусите още не са уточнени."
  },

  // Booked parties. stage: scheduled | confirmed | done.
  // deposit.status: received | missing. parentMessage: sent | not-sent (Viber/email to the parent).
  // providers: external suppliers; status requested | confirmed.
  bookings: [
    {
      id: "b1", date: "2026-09-26", start: "10:30", end: "12:30", stage: "confirmed",
      child: { name: "Мила", age: 6 }, customerId: "c1", program: "Принцеси", children: 12,
      address: { line: "ул. „Червена стена“ 14, вх. Б, ет. 3, ап. 9", district: "Лозенец", notes: "Звънецът е на Петрови. Паркиране в двора зад блока.", usable: true },
      animators: ["a2"], deposit: { status: "received", on: "2026-09-18" }, parentMessage: "sent",
      providers: [{ kind: "Торта", name: "Сладкарница „Бонбона“", status: "confirmed" }]
    },
    {
      id: "b2", date: "2026-09-26", start: "13:00", end: "15:00", stage: "confirmed",
      child: { name: "Боян", age: 5 }, customerId: "c3", program: "Супергерои", children: 18,
      address: { line: "бул. „Александър Малинов“ 51, бл. 330, вх. А, ет. 6", district: "Младост 1", notes: "Асансьорът е малък, реквизитът се качва на два пъти.", usable: true },
      animators: ["a2", "a4"], deposit: { status: "received", on: "2026-09-12" }, parentMessage: "sent",
      providers: []
    },
    {
      id: "b3", date: "2026-09-26", start: "14:30", end: "16:00", stage: "scheduled",
      child: { name: "Дара", age: 7 }, customerId: "c5", program: "Научно шоу", children: 20,
      address: { line: "ул. „Кумата“ 38, къща", district: "Бояна", notes: "Градината е отзад, влиза се през зелената врата.", usable: true },
      animators: ["a2"], deposit: { status: "received", on: "2026-09-20" }, parentMessage: "not-sent",
      clash: { animator: "a2", with: "b2", note: "Ива е на Боян в Младост 1 до 15:00; Бояна е на 40 минути път." },
      providers: []
    },
    {
      id: "b4", date: "2026-09-26", start: "16:00", end: "18:00", stage: "scheduled",
      child: { name: "Ники", age: 4 }, customerId: "c6", program: "Пирати", children: 10,
      address: { line: "ул. „Хан Омуртаг“ 7, бл. 512, вх. В, ет. 2", district: "Надежда 2", notes: "", usable: true },
      animators: ["a3"], deposit: { status: "missing", on: null }, parentMessage: "sent",
      providers: [{ kind: "Балони", name: "Балонено царство", status: "requested" }]
    },
    {
      id: "b5", date: "2026-09-27", start: "11:00", end: "13:00", stage: "scheduled",
      child: { name: "Алекс", age: 8 }, customerId: "c7", program: "Детективи", children: 25,
      address: { line: "Игрална зала „Смехорани“, ул. „Филип Кутев“ 3", district: "Кръстова вада", notes: "Залата е наета до 13:30. Ключ от охраната.", usable: true },
      animators: [], deposit: { status: "received", on: "2026-09-09" }, parentMessage: "not-sent",
      providers: [{ kind: "Торта", name: "Сладкарница „Бонбона“", status: "requested" }]
    },
    {
      id: "b6", date: "2026-09-27", start: "15:00", end: "17:00", stage: "scheduled",
      child: { name: "Виктория", age: 3 }, customerId: "c8", program: "Ледено кралство", children: 8,
      address: { line: "ул. „Витошки рози“", district: "Витоша", notes: "Номер, вход и етаж липсват във формата.", usable: false },
      animators: ["a2"], deposit: { status: "missing", on: null }, parentMessage: "not-sent",
      providers: []
    },
    {
      id: "b7", date: "2026-09-30", start: "17:30", end: "19:00", stage: "confirmed",
      child: { name: "Самуил", age: 10 }, customerId: "c9", program: "Научно шоу", children: 14,
      address: { line: "ул. „Проф. Александър Фол“ 2, общ. 58, ет. 1, клуб", district: "Студентски град", notes: "", usable: true },
      animators: ["a1"], deposit: { status: "received", on: "2026-09-22" }, parentMessage: "sent",
      providers: []
    },
    {
      id: "b8", date: "2026-10-03", start: "11:00", end: "14:00", stage: "confirmed",
      child: { name: "Калина и Калоян", age: 6 }, customerId: "c2", program: "Супергерои", children: 42,
      address: { line: "Ресторант „Градината“, ул. „Изгрев“ 11 (залата на втория етаж, влизане откъм паркинга)", district: "Драгалевци", notes: "Близнаци, две торти, две песни. Родителите искат отделна игра за децата под 4 г. в малката зала. Трима аниматори; главният води програмата, другите двама поемат малките и фейс арта.", usable: true },
      animators: ["a1", "a5", "a6"], deposit: { status: "received", on: "2026-09-05" }, parentMessage: "sent",
      providers: [
        { kind: "Торта", name: "Сладкарница „Бонбона“", status: "confirmed" },
        { kind: "Балони", name: "Балонено царство", status: "confirmed" },
        { kind: "Фотограф", name: "Студио „Кадър“", status: "requested" }
      ]
    },
    {
      id: "b9", date: "2026-10-03", start: "16:00", end: "18:00", stage: "confirmed",
      child: { name: "Йоана", age: 5 }, customerId: "c10", program: "Принцеси", children: 15,
      address: { line: "ж.к. Люлин 5, бл. 523, вх. Б, ет. 8, ап. 44", district: "Люлин 5", notes: "Кодът на входа е 44 и звънец.", usable: true },
      animators: ["a2"], deposit: { status: "received", on: "2026-09-19" }, parentMessage: "sent",
      providers: []
    },
    {
      id: "b10", date: "2026-10-04", start: "12:00", end: "14:00", stage: "scheduled",
      child: { name: "Георги", age: 7 }, customerId: "c4", program: "Супергерои", children: 16,
      address: { line: "ул. „Екзарх Йосиф“ 65, ет. 4", district: "Център", notes: "Паркирането е синя зона.", usable: true },
      animators: ["a2"], deposit: { status: "missing", on: null }, parentMessage: "sent",
      providers: []
    },
    {
      id: "b11", date: "2026-10-10", start: "10:00", end: "12:00", stage: "scheduled",
      child: { name: "Мартин", age: 9 }, customerId: "c11", program: "Футбол", children: 22,
      address: { line: "Футболно игрище „Академика“, ул. „Проф. Георги Павлов“ 8", district: "Дианабад", notes: "Изкуствена трева, без обувки с бутони.", usable: true },
      animators: ["a4"], deposit: { status: "received", on: "2026-09-24" }, parentMessage: "not-sent",
      providers: []
    },

    // Parties already done this month (used by my-pay and customer history).
    { id: "p1", date: "2026-09-05", start: "11:00", end: "13:00", stage: "done", child: { name: "Никол", age: 6 }, customerId: "c12", program: "Принцеси", children: 14, address: { line: "ул. „Люлякова градина“ 12", district: "Изток", notes: "", usable: true }, animators: ["a2"], deposit: { status: "received", on: "2026-08-28" }, parentMessage: "sent", providers: [] },
    { id: "p2", date: "2026-09-06", start: "15:00", end: "17:30", stage: "done", overtimeMinutes: 30, child: { name: "Даниел", age: 8 }, customerId: "c3", program: "Научно шоу", children: 19, address: { line: "бул. „Андрей Ляпчев“ 20", district: "Младост 1", notes: "", usable: true }, animators: ["a1", "a2"], deposit: { status: "received", on: "2026-08-30" }, parentMessage: "sent", providers: [] },
    { id: "p3", date: "2026-09-12", start: "10:00", end: "12:00", stage: "done", child: { name: "Ема", age: 4 }, customerId: "c13", program: "Ледено кралство", children: 9, address: { line: "ул. „Средна гора“ 49", district: "Център", notes: "", usable: true }, animators: ["a2"], deposit: { status: "received", on: "2026-09-02" }, parentMessage: "sent", providers: [] },
    { id: "p4", date: "2026-09-13", start: "11:00", end: "13:00", stage: "done", child: { name: "Петър", age: 5 }, customerId: "c1", program: "Супергерои", children: 13, address: { line: "ул. „Червена стена“ 14, вх. Б, ет. 3", district: "Лозенец", notes: "", usable: true }, animators: ["a2"], deposit: { status: "received", on: "2026-09-04" }, parentMessage: "sent", providers: [] },
    { id: "p5", date: "2026-09-13", start: "16:00", end: "18:00", stage: "done", child: { name: "Лора", age: 7 }, customerId: "c14", program: "Принцеси", children: 17, address: { line: "ж.к. Дружба 2, бл. 407", district: "Дружба 2", notes: "", usable: true }, animators: ["a2"], deposit: { status: "received", on: "2026-09-06" }, parentMessage: "sent", providers: [] },
    { id: "p6", date: "2026-09-19", start: "12:00", end: "14:00", stage: "done", child: { name: "Иван", age: 6 }, customerId: "c4", program: "Супергерои", children: 20, address: { line: "ул. „Екзарх Йосиф“ 65, ет. 4", district: "Център", notes: "", usable: true }, animators: ["a2", "a4"], deposit: { status: "received", on: "2026-09-10" }, parentMessage: "sent", providers: [] },
    { id: "p7", date: "2026-09-20", start: "10:30", end: "12:30", stage: "done", child: { name: "Сияна", age: 5 }, customerId: "c15", program: "Принцеси", children: 11, address: { line: "ул. „Тинтява“ 88", district: "Изгрев", notes: "", usable: true }, animators: ["a2"], deposit: { status: "missing", on: null }, parentMessage: "sent", providers: [], note: "Капарото не е отбелязано, въпреки че партито мина." }
  ],

  // Orders from the website form. The real form fields are unknown; these fields are assumed.
  // status: new | replied | booked. flags: large | repeat | missing-info | short-notice.
  orders: [
    {
      id: "o1", receivedAt: "2026-09-25T09:12", status: "new",
      parent: { name: "Десислава Ангелова", phone: "+359 88 222 7410", email: "desi.angelova@example.bg" },
      child: { name: "Ема", age: 5 }, wantedDate: "2026-10-11", wantedTime: "11:00", program: "Принцеси", children: 15,
      place: "Вкъщи, Овча купел 2", customerId: null,
      message: "Здравейте! Искаме парти с принцеси за Ема, по възможност с Елза. Имаме хол и тераса.",
      flags: []
    },
    {
      id: "o2", receivedAt: "2026-09-25T08:40", status: "new",
      parent: { name: "Гергана Иванова", phone: "+359 87 555 0192", email: "g.ivanova@example.bg" },
      child: { name: "Иван", age: 7 }, wantedDate: "2026-10-17", wantedTime: "12:00", program: "Супергерои", children: 20,
      place: "ул. „Екзарх Йосиф“ 65, ет. 4, Център", customerId: "c4",
      message: "Пак сме ние :) Миналата година Ива беше страхотна, може ли пак тя?",
      flags: ["repeat"]
    },
    {
      id: "o3", receivedAt: "2026-09-24T21:55", status: "new",
      parent: { name: "Радостина Кирилова-Бонева", phone: "+359 89 640 3318", email: "rkboneva@example.bg" },
      child: { name: "Борис и Беатрис", age: 6 }, wantedDate: "2026-10-24", wantedTime: "11:00", program: "Пирати", children: 45,
      place: "Детски център „Пъзел“, Студентски град", customerId: null,
      message: "Рожден ден на близнаци заедно с целия клас от градината. Трябват ни поне трима аниматори и нещо за по-малките братчета.",
      flags: ["large"]
    },
    {
      id: "o4", receivedAt: "2026-09-24T18:20", status: "new",
      parent: { name: "Цветелина Маркова", phone: "+359 88 717 2004", email: "" },
      child: { name: "Лъчезар", age: 4 }, wantedDate: "2026-09-26", wantedTime: "14:00", program: "Супергерои", children: 10,
      place: "бул. „Цар Борис III“ 136, Красно село", customerId: null,
      message: "Знам, че е в последния момент. Утре ли можете?",
      flags: ["short-notice"]
    },
    {
      id: "o5", receivedAt: "2026-09-24T14:03", status: "new",
      parent: { name: "Мартин", phone: "", email: "martin.k@example.com" },
      child: { name: "", age: null }, wantedDate: null, wantedTime: null, program: "Научно шоу", children: null,
      place: "", customerId: null,
      message: "Колко струва научното шоу?",
      flags: ["missing-info"]
    },
    {
      id: "o6", receivedAt: "2026-09-23T22:47", status: "new",
      parent: { name: "Анна-Мария Стефанова", phone: "+359 87 900 1234", email: "am.stefanova@example.bg" },
      child: { name: "Слава", age: 6 }, wantedDate: "2026-10-18", wantedTime: "15:30", program: "Ледено кралство", children: 18,
      place: "ул. „Братя Миладинови“ 23, ет. 2, Център (стар блок без асансьор)",
      customerId: null,
      message: "Здравейте, пиша ви малко по-подробно, защото имаме няколко особености. Слава е алергична към ядки и към някои бои за лице, затова ви молим фейс артът да е само с хипоалергенни бои или изобщо да няма. Две от децата са с аутизъм и не понасят силна музика и балони, които се пукат, така че предпочитаме по-тиха програма и без пукане на балони. Апартаментът е на втори етаж в стар блок без асансьор. Ще има и около десет възрастни. Имате ли опит с такива партита? Благодаря предварително!",
      flags: []
    },
    {
      id: "o7", receivedAt: "2026-09-23T10:15", status: "new",
      parent: { name: "Olivia Bennett", phone: "+44 7700 900417", email: "olivia.bennett@example.co.uk" },
      child: { name: "Noah", age: 5 }, wantedDate: "2026-10-10", wantedTime: "15:00", program: "Пирати", children: 12,
      place: "Sofia, Boyana, ul. Beli Iskar 12", customerId: null,
      message: "Hi! Sorry, I don't speak Bulgarian yet. Could the animator do part of the party in English? Half the kids are from the international school.",
      flags: []
    },
    {
      id: "o8", receivedAt: "2026-09-22T12:30", status: "replied",
      parent: { name: "Калин Димитров", phone: "+359 88 332 9001", email: "kalin.d@example.bg" },
      child: { name: "Виктор", age: 8 }, wantedDate: "2026-10-17", wantedTime: "16:00", program: "Детективи", children: 16,
      place: "ул. „Оборище“ 40, Център", customerId: null,
      message: "Интересува ме детективското парти.",
      flags: []
    },
    {
      id: "o9", receivedAt: "2026-09-21T09:05", status: "booked", bookingId: "b7",
      parent: { name: "Елица Попова", phone: "+359 89 102 7766", email: "elitsa.popova@example.bg" },
      child: { name: "Самуил", age: 10 }, wantedDate: "2026-09-30", wantedTime: "17:30", program: "Научно шоу", children: 14,
      place: "Студентски град, общ. 58", customerId: "c9",
      message: "Искаме научно шоу в клуба на общежитието.",
      flags: []
    }
  ],

  // Families. children[].birthday is ISO; upcoming birthdays are computed from today.
  customers: [
    { id: "c1", parent: "Весела Петрова", phone: "+359 88 610 4472", email: "vesela.p@example.bg", district: "Лозенец", since: "2023-04-02", children: [{ name: "Мила", birthday: "2020-09-26" }, { name: "Петър", birthday: "2021-09-13" }], note: "Предпочитат Ива." },
    { id: "c2", parent: "Надежда и Павел Кръстеви", phone: "+359 87 443 0981", email: "krastevi@example.bg", district: "Драгалевци", since: "2022-10-01", children: [{ name: "Калина", birthday: "2020-10-03" }, { name: "Калоян", birthday: "2020-10-03" }], note: "Големи партита в ресторант, винаги с фотограф." },
    { id: "c3", parent: "Добромир Тодоров", phone: "+359 89 220 5143", email: "dtodorov@example.bg", district: "Младост 1", since: "2025-09-06", children: [{ name: "Даниел", birthday: "2018-09-06" }, { name: "Боян", birthday: "2021-09-28" }], note: "" },
    { id: "c4", parent: "Гергана Иванова", phone: "+359 87 555 0192", email: "g.ivanova@example.bg", district: "Център", since: "2021-10-16", children: [{ name: "Иван", birthday: "2019-10-17" }, { name: "Георги", birthday: "2019-10-04" }], note: "Братовчеди, отделни партита. Искат Ива." },
    { id: "c5", parent: "Борислава Христова", phone: "+359 88 781 3309", email: "b.hristova@example.bg", district: "Бояна", since: "2026-09-10", children: [{ name: "Дара", birthday: "2019-09-27" }], note: "" },
    { id: "c6", parent: "Илиян Николов", phone: "+359 87 014 2256", email: "", district: "Надежда 2", since: "2026-09-14", children: [{ name: "Ники", birthday: "2022-09-29" }], note: "Капарото е обещано за петък." },
    { id: "c7", parent: "Милена Георгиева", phone: "+359 89 555 8120", email: "milena.g@example.bg", district: "Кръстова вада", since: "2025-09-20", children: [{ name: "Алекс", birthday: "2018-09-27" }], note: "" },
    { id: "c8", parent: "Симона Вълчева", phone: "+359 88 900 3471", email: "simona.v@example.bg", district: "Витоша", since: "2026-09-21", children: [{ name: "Виктория", birthday: "2023-09-27" }], note: "Непълен адрес от формата." },
    { id: "c9", parent: "Елица Попова", phone: "+359 89 102 7766", email: "elitsa.popova@example.bg", district: "Студентски град", since: "2026-09-21", children: [{ name: "Самуил", birthday: "2016-09-30" }], note: "" },
    { id: "c10", parent: "Даниела Костова", phone: "+359 87 331 6620", email: "dkostova@example.bg", district: "Люлин 5", since: "2025-10-04", children: [{ name: "Йоана", birthday: "2021-10-03" }], note: "" },
    { id: "c11", parent: "Стоян Андреев", phone: "+359 88 144 9082", email: "s.andreev@example.bg", district: "Дианабад", since: "2024-10-12", children: [{ name: "Мартин", birthday: "2017-10-10" }], note: "" },
    { id: "c12", parent: "Ралица Методиева", phone: "+359 89 008 7411", email: "ralitsa.m@example.bg", district: "Изток", since: "2025-09-06", children: [{ name: "Никол", birthday: "2020-09-05" }, { name: "Андрей", birthday: "2022-10-14" }], note: "" },
    { id: "c13", parent: "Цветомир Лазаров", phone: "+359 88 377 1205", email: "", district: "Център", since: "2026-09-02", children: [{ name: "Ема", birthday: "2022-09-12" }], note: "" },
    { id: "c14", parent: "Яна Пенева", phone: "+359 87 662 3390", email: "yana.peneva@example.bg", district: "Дружба 2", since: "2024-09-14", children: [{ name: "Лора", birthday: "2019-09-13" }, { name: "Кая", birthday: "2023-10-08" }], note: "" },
    { id: "c15", parent: "Огнян Баев", phone: "+359 89 480 5561", email: "o.baev@example.bg", district: "Изгрев", since: "2026-09-08", children: [{ name: "Сияна", birthday: "2021-09-20" }], note: "" }
  ],

  // Earlier parties before this month, so customer history has depth.
  history: [
    { customerId: "c1", date: "2025-09-27", child: "Мила", program: "Принцеси", children: 11 },
    { customerId: "c1", date: "2024-09-28", child: "Мила", program: "Ледено кралство", children: 9 },
    { customerId: "c1", date: "2025-09-13", child: "Петър", program: "Пирати", children: 10 },
    { customerId: "c2", date: "2025-10-04", child: "Калина и Калоян", program: "Пирати", children: 38 },
    { customerId: "c2", date: "2024-10-05", child: "Калина и Калоян", program: "Принцеси", children: 35 },
    { customerId: "c2", date: "2023-10-07", child: "Калина и Калоян", program: "Балони", children: 30 },
    { customerId: "c3", date: "2025-09-06", child: "Даниел", program: "Супергерои", children: 15 },
    { customerId: "c4", date: "2025-10-18", child: "Иван", program: "Супергерои", children: 18 },
    { customerId: "c4", date: "2025-10-05", child: "Георги", program: "Пирати", children: 14 },
    { customerId: "c4", date: "2024-10-19", child: "Иван", program: "Научно шоу", children: 16 },
    { customerId: "c7", date: "2025-09-27", child: "Алекс", program: "Футбол", children: 24 },
    { customerId: "c10", date: "2025-10-04", child: "Йоана", program: "Принцеси", children: 12 },
    { customerId: "c11", date: "2024-10-12", child: "Мартин", program: "Футбол", children: 20 },
    { customerId: "c11", date: "2025-10-11", child: "Мартин", program: "Детективи", children: 21 },
    { customerId: "c12", date: "2025-09-06", child: "Никол", program: "Принцеси", children: 12 },
    { customerId: "c14", date: "2024-09-14", child: "Лора", program: "Пирати", children: 15 },
    { customerId: "c14", date: "2025-09-13", child: "Лора", program: "Ледено кралство", children: 16 }
  ],

  // Leave. status: pending | approved | rejected. Overlapping bookings are listed in conflicts.
  leave: [
    { id: "l1", animatorId: "a2", from: "2026-10-02", to: "2026-10-04", reason: "Сватба на сестра ми в Пловдив. Тръгвам в петък сутринта и се връщам в неделя вечерта.", status: "pending", requestedAt: "2026-09-24T19:40", conflicts: ["b9", "b10"], ownerNote: "" },
    { id: "l2", animatorId: "a4", from: "2026-10-12", to: "2026-10-13", reason: "Изпит в университета", status: "pending", requestedAt: "2026-09-23T11:02", conflicts: [], ownerNote: "" },
    { id: "l3", animatorId: "a6", from: "2026-09-26", to: "2026-09-26", reason: "Болен съм, температура", status: "pending", requestedAt: "2026-09-25T07:55", conflicts: [], ownerNote: "" },
    { id: "l4", animatorId: "a3", from: "2026-09-07", to: "2026-09-09", reason: "Почивка", status: "approved", requestedAt: "2026-08-20T10:00", conflicts: [], ownerNote: "" },
    { id: "l5", animatorId: "a2", from: "2026-10-19", to: "2026-10-19", reason: "Час при лекар", status: "approved", requestedAt: "2026-09-15T16:20", conflicts: [], ownerNote: "" },
    { id: "l6", animatorId: "a1", from: "2026-09-27", to: "2026-09-27", reason: "Семеен повод", status: "rejected", requestedAt: "2026-09-18T09:30", conflicts: [], ownerNote: "Неделя е пълна. Можеш ли да се смениш с Кристиан?" },
    { id: "l7", animatorId: "a2", from: "2026-08-10", to: "2026-08-16", reason: "Море", status: "approved", requestedAt: "2026-07-01T12:00", conflicts: [], ownerNote: "" }
  ],

  // Pay. Amounts stay null until the owner supplies the animator cut and bonus formula.
  // Each month lists the parties an animator worked; role lead | helper.
  pay: {
    a2: {
      months: [
        {
          month: "2026-09", status: "open",
          items: [
            { bookingId: "p1", role: "lead", hours: 2, amount: null },
            { bookingId: "p2", role: "helper", hours: 2.5, amount: null, note: "30 мин. повече по молба на родителите" },
            { bookingId: "p3", role: "lead", hours: 2, amount: null },
            { bookingId: "p4", role: "lead", hours: 2, amount: null },
            { bookingId: "p5", role: "lead", hours: 2, amount: null },
            { bookingId: "p6", role: "lead", hours: 2, amount: null },
            { bookingId: "p7", role: "lead", hours: 2, amount: null, note: "Капарото на родителите не е отбелязано" },
            { bookingId: "b1", role: "lead", hours: 2, amount: null, upcoming: true },
            { bookingId: "b2", role: "lead", hours: 2, amount: null, upcoming: true },
            { bookingId: "b3", role: "lead", hours: 1.5, amount: null, upcoming: true },
            { bookingId: "b6", role: "lead", hours: 2, amount: null, upcoming: true }
          ],
          bonus: null, total: null
        },
        { month: "2026-08", status: "checked", parties: 6, hours: 12.5, bonus: null, total: null, checkedOn: "2026-09-03" },
        { month: "2026-07", status: "checked", parties: 11, hours: 23, bonus: null, total: null, checkedOn: "2026-08-04" }
      ]
    }
  }
};
