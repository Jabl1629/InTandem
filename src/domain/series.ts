import type { DomainId, Reading } from '@/types'
import { diffDays, parseISO } from '@/lib/dates'

export interface Point {
  date: string
  value: number
}

/** Readings for one resident+domain, sorted ascending by date. */
export function seriesFor(readings: Reading[], residentId: string, domainId: DomainId): Point[] {
  return readings
    .filter((r) => r.residentId === residentId && r.domainId === domainId)
    .map((r) => ({ date: r.date, value: r.value }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

export function latest(series: Point[]): Point | undefined {
  return series.length ? series[series.length - 1] : undefined
}

export function firstPoint(series: Point[]): Point | undefined {
  return series.length ? series[0] : undefined
}

/** Mean of the last n non-missing readings (or fewer if the series is short). */
export function lastNMean(series: Point[], n: number): number | undefined {
  const pts = series.slice(-n)
  if (!pts.length) return undefined
  return mean(pts.map((p) => p.value))
}

/** Mean of readings within ±halfWindow days of a target date. Falls back to
 * the single nearest reading if nothing lands in the window. */
export function meanAround(series: Point[], iso: string, halfWindow = 3): number | undefined {
  if (!series.length) return undefined
  const within = series.filter((p) => Math.abs(diffDays(p.date, iso)) <= halfWindow)
  if (within.length) return mean(within.map((p) => p.value))
  return valueNearest(series, iso)
}

export function valueNearest(series: Point[], iso: string): number | undefined {
  if (!series.length) return undefined
  let best = series[0]
  let bestDist = Math.abs(diffDays(series[0].date, iso))
  for (const p of series) {
    const d = Math.abs(diffDays(p.date, iso))
    if (d < bestDist) {
      best = p
      bestDist = d
    }
  }
  return best.value
}

/** Mean over a trailing window of the last `days` calendar days from the end. */
export function trailingMean(series: Point[], days: number): number | undefined {
  const last = latest(series)
  if (!last) return undefined
  const pts = series.filter((p) => diffDays(p.date, last.date) < days)
  return pts.length ? mean(pts.map((p) => p.value)) : undefined
}

/** Mean over the window [endIso - days, endIso - offsetDays]. Used for
 * "prior 30-day average" comparisons. */
export function windowMean(
  series: Point[],
  endIso: string,
  fromDaysAgo: number,
  toDaysAgo: number,
): number | undefined {
  const pts = series.filter((p) => {
    const age = diffDays(p.date, endIso) // positive when p is before endIso
    return age > toDaysAgo && age <= fromDaysAgo
  })
  return pts.length ? mean(pts.map((p) => p.value)) : undefined
}

/** The last `days` calendar days of readings (most recent window). */
export function lastDays(series: Point[], days: number): Point[] {
  const last = latest(series)
  if (!last) return []
  return series.filter((p) => diffDays(p.date, last.date) < days)
}

export function mean(xs: number[]): number {
  if (!xs.length) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Value on/near a given date, preferring an exact hit. */
export function valueOn(series: Point[], iso: string): number | undefined {
  const exact = series.find((p) => p.date === iso)
  if (exact) return exact.value
  return valueNearest(series, iso)
}

export { parseISO }
