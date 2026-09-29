// Shared sample data for every variant. The lead agent writes it from the brief:
// every record the screens need, with the difficult states the brief implies
// (conflicts, missing information, long text, unknown figures left unset).
// Models import it and never edit it. Replace this placeholder before designing.
export const data = {
  today: "2026-01-01",
} as const

export type Data = typeof data
