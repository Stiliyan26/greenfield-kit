import { calendar as routeCalendar, booking as routeBooking, animator as routeAnimator } from "./candidates/route/markup.js"
import { calendar as tableCalendar, booking as tableBooking, animator as tableAnimator } from "./candidates/table/markup.js"
import { calendar as deskCalendar, booking as deskBooking, animator as deskAnimator } from "./candidates/desk/markup.js"

export const concepts = [
  { id: "route", name: "Route", note: "Time order, address first", number: "A", defaultHue: 205, defaultFont: "commissioner" },
  { id: "table", name: "Table", note: "Who is free at each hour", number: "B", defaultHue: 222, defaultFont: "plex" },
  { id: "desk", name: "Desk", note: "Decisions before the day", number: "C", defaultHue: 198, defaultFont: "sofia" },
]

const screens = {
  route: { calendar: routeCalendar, booking: routeBooking, animator: routeAnimator },
  table: { calendar: tableCalendar, booking: tableBooking, animator: tableAnimator },
  desk: { calendar: deskCalendar, booking: deskBooking, animator: deskAnimator },
}

export function renderScreen(concept, screen) {
  return screens[concept][screen]()
}
