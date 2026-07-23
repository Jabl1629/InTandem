import type { DomainId, DomainStatus } from '@/types'
import { addDays, isoDate, parseISO } from '@/lib/dates'
import {
  lastDays,
  lastNMean,
  latest,
  meanAround,
  trailingMean,
  valueNearest,
  windowMean,
  type Point,
} from './series'

export interface StatusResult {
  status: DomainStatus
  /** defensible one-line explanation, quotable to a clinician */
  reason: string
  /** computed values for display / hover / debug */
  metrics: Record<string, number>
}

const STABLE: StatusResult = { status: 'stable', reason: 'Within normal range', metrics: {} }

function isoDaysBefore(iso: string, n: number): string {
  return isoDate(addDays(parseISO(iso), -n))
}

function worst(a: DomainStatus, b: DomainStatus): DomainStatus {
  const rank: Record<DomainStatus, number> = { stable: 0, watch: 1, alert: 2 }
  return rank[a] >= rank[b] ? a : b
}

/** Weight: CMS-meaningful unintended loss. watch 3–4.9%/30d; alert ≥5%/30d or ≥10%/180d. */
export function weightStatus(series: Point[]): StatusResult {
  const last = latest(series)
  if (!last) return STABLE
  const current = lastNMean(series, 3) ?? last.value
  const w30 = valueNearest(series, isoDaysBefore(last.date, 30))
  const w180 = valueNearest(series, isoDaysBefore(last.date, 180))
  const pctLoss30 = w30 ? ((w30 - current) / w30) * 100 : 0
  const pctLoss180 = w180 ? ((w180 - current) / w180) * 100 : 0
  const metrics = { pctLoss30, pctLoss180, current }

  if (pctLoss30 >= 5)
    return { status: 'alert', reason: `${pctLoss30.toFixed(1)}% loss in 30 days (≥5% CMS threshold)`, metrics }
  if (pctLoss180 >= 10)
    return { status: 'alert', reason: `${pctLoss180.toFixed(1)}% loss in 180 days (≥10% CMS threshold)`, metrics }
  if (pctLoss30 >= 3)
    return { status: 'watch', reason: `${pctLoss30.toFixed(1)}% loss in 30 days`, metrics }
  return { status: 'stable', reason: 'Weight stable', metrics }
}

/** Gait speed: watch 0.05–0.1 m/s decline / 30d; alert >0.1 m/s (clinically meaningful). */
export function gaitStatus(series: Point[]): StatusResult {
  const last = latest(series)
  if (!last) return STABLE
  const current = lastNMean(series, 7)
  const g30 = meanAround(series, isoDaysBefore(last.date, 30), 4)
  if (current === undefined || g30 === undefined) return STABLE
  const decline = g30 - current // positive = slowing
  const metrics = { decline, current, prior: g30 }

  if (decline > 0.1)
    return { status: 'alert', reason: `Gait speed down ${decline.toFixed(2)} m/s over 30 days (>0.1 clinically meaningful)`, metrics }
  if (decline >= 0.05)
    return { status: 'watch', reason: `Gait speed down ${decline.toFixed(2)} m/s over 30 days`, metrics }
  return { status: 'stable', reason: 'Gait speed steady', metrics }
}

/** Activity: watch >25% drop vs prior 30d avg; alert >40% or 3+ zero-use days in a week. */
export function activityStatus(series: Point[]): StatusResult {
  const last = latest(series)
  if (!last) return STABLE
  const last7 = trailingMean(series, 7)
  const prior30 = windowMean(series, last.date, 37, 7)
  const zeroDays = lastDays(series, 7).filter((p) => p.value < 20).length
  if (last7 === undefined || prior30 === undefined || prior30 === 0)
    return { ...STABLE, metrics: { zeroDays } }
  const dropPct = ((prior30 - last7) / prior30) * 100
  const metrics = { dropPct, last7, prior30, zeroDays }

  if (dropPct > 40 || zeroDays >= 3)
    return {
      status: 'alert',
      reason:
        zeroDays >= 3
          ? `${zeroDays} zero-use days this week`
          : `Daily distance down ${dropPct.toFixed(0)}% vs prior 30-day average`,
      metrics,
    }
  if (dropPct > 25)
    return { status: 'watch', reason: `Daily distance down ${dropPct.toFixed(0)}% vs prior 30-day average`, metrics }
  return { status: 'stable', reason: 'Activity consistent', metrics }
}

/** Hydration: watch <70% of goal on 3+ of last 7 days; alert on 5+ of last 7. */
export function hydrationStatus(series: Point[], goal: number): StatusResult {
  const last7 = lastDays(series, 7)
  if (!last7.length) return STABLE
  const daysUnder = last7.filter((p) => p.value < 0.7 * goal).length
  const goalHitRate = last7.filter((p) => p.value >= goal).length / last7.length
  const metrics = { daysUnder, goalHitRate, goal }

  if (daysUnder >= 5)
    return { status: 'alert', reason: `Under 70% of goal on ${daysUnder} of last 7 days`, metrics }
  if (daysUnder >= 3)
    return { status: 'watch', reason: `Under 70% of goal on ${daysUnder} of last 7 days`, metrics }
  return { status: 'stable', reason: 'Meeting hydration goal', metrics }
}

/** Nutrition: watch <75% avg intake over 3 days; alert <50% for 3 consecutive days. */
export function nutritionStatus(series: Point[]): StatusResult {
  const avg3 = lastNMean(series, 3)
  const last3 = series.slice(-3)
  const threeConsecutiveUnder50 = last3.length === 3 && last3.every((p) => p.value < 50)
  const metrics = { avg3: avg3 ?? 0 }
  if (avg3 === undefined) return STABLE

  if (threeConsecutiveUnder50)
    return { status: 'alert', reason: 'Under 50% intake for 3 consecutive days', metrics }
  if (avg3 < 75)
    return { status: 'watch', reason: `${avg3.toFixed(0)}% average intake over 3 days`, metrics }
  return { status: 'stable', reason: 'Eating well', metrics }
}

/** Wellness: watch check-in completion <60%/wk; alert 3+ anxiety flags in 7d or mood avg ≤2/wk. */
export function wellnessStatus(series: Point[]): StatusResult {
  const week = lastDays(series, 7)
  const completion = Math.min(week.length / 7, 1)
  const moodAvg7 = week.length ? week.reduce((a, p) => a + p.value, 0) / week.length : 0
  const anxietyFlags = week.filter((p) => p.value <= 2).length
  const metrics = { completion, moodAvg7, anxietyFlags }
  if (!week.length) return { status: 'watch', reason: 'No check-ins this week', metrics }

  if (anxietyFlags >= 3)
    return { status: 'alert', reason: `${anxietyFlags} low-mood/anxiety flags in 7 days`, metrics }
  if (moodAvg7 <= 2)
    return { status: 'alert', reason: `Average mood ${moodAvg7.toFixed(1)}/5 for the week`, metrics }
  if (completion < 0.6)
    return { status: 'watch', reason: `Only ${Math.round(completion * 100)}% of check-ins completed`, metrics }
  return { status: 'stable', reason: 'Engaged and steady', metrics }
}

export interface StatusOpts {
  hydrationGoal?: number
}

/** Dispatch to the right threshold function for a sensor domain. */
export function domainStatus(domainId: DomainId, series: Point[], opts: StatusOpts = {}): StatusResult {
  switch (domainId) {
    case 'weight':
      return weightStatus(series)
    case 'mobility_gait':
      return gaitStatus(series)
    case 'mobility_activity':
      return activityStatus(series)
    case 'hydration':
      return hydrationStatus(series, opts.hydrationGoal ?? 1500)
    case 'nutrition':
      return nutritionStatus(series)
    case 'wellness':
      return wellnessStatus(series)
    default:
      return STABLE
  }
}

/**
 * Significant-change trigger (spec §6): ≥2 domains at alert, OR 1 alert + a
 * fall in the last 30 days. Encodes the stability→instability meeting-type
 * transition — the sensors' headline value claim.
 */
export function significantChange(
  statuses: DomainStatus[],
  fallInLast30d: boolean,
): { triggered: boolean; reason: string } {
  const alertCount = statuses.filter((s) => s === 'alert').length
  if (alertCount >= 2)
    return { triggered: true, reason: `${alertCount} domains crossed alert thresholds` }
  if (alertCount >= 1 && fallInLast30d)
    return { triggered: true, reason: '1 alert domain plus a fall in the last 30 days' }
  return { triggered: false, reason: '' }
}

export { worst }
