import type { DomainId, DomainStatus } from '@/types'
import type { StatusResult } from './thresholds'

export interface ChangeFactor {
  label: string
  points: number
}

export interface ChangeScoreResult {
  score: number
  factors: ChangeFactor[]
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

/**
 * Change Score (spec §6): weighted sum of normalized 30-day adverse deltas
 * across sensor domains, + 10 per alert domain, + 5 per watch domain,
 * + 5 per overdue commitment. Every contributing factor is returned so the
 * Rounding Board can show the breakdown on hover — no black box.
 *
 * Note: we approximate "new" alert/watch as "currently" alert/watch, since the
 * prototype does not retain per-conference status history.
 */
export function changeScore(
  statuses: Partial<Record<DomainId, StatusResult>>,
  overdueCount: number,
): ChangeScoreResult {
  const factors: ChangeFactor[] = []
  const add = (label: string, points: number) => {
    if (points > 0) factors.push({ label, points: Math.round(points) })
  }

  // --- Normalized adverse 30-day deltas (magnitude of movement) ---
  const gait = statuses.mobility_gait?.metrics
  if (gait && gait.decline > 0)
    add(`Gait ▼${gait.decline.toFixed(2)} m/s / 30d`, clamp01(gait.decline / 0.15) * 20)

  const act = statuses.mobility_activity?.metrics
  if (act && act.dropPct > 0)
    add(`Activity ▼${act.dropPct.toFixed(0)}% / 30d`, clamp01(act.dropPct / 50) * 15)

  const wt = statuses.weight?.metrics
  if (wt && wt.pctLoss30 > 0)
    add(`Weight ▼${wt.pctLoss30.toFixed(1)}% / 30d`, clamp01(wt.pctLoss30 / 8) * 20)

  const hyd = statuses.hydration?.metrics
  if (hyd && hyd.daysUnder > 0)
    add(`Hydration low ${hyd.daysUnder}/7 days`, (hyd.daysUnder / 7) * 10)

  const nut = statuses.nutrition?.metrics
  if (nut && nut.avg3 < 85)
    add(`Nutrition ${nut.avg3.toFixed(0)}% intake`, clamp01((85 - nut.avg3) / 40) * 10)

  const wel = statuses.wellness?.metrics
  if (wel) {
    const moodShort = clamp01((3.5 - wel.moodAvg7) / 2)
    const anx = clamp01(wel.anxietyFlags / 5)
    const pts = Math.max(moodShort, anx) * 10
    if (pts > 0) add(`Wellness mood ${wel.moodAvg7.toFixed(1)}/5`, pts)
  }

  // --- Status + commitment bonuses ---
  const values = Object.values(statuses).filter(Boolean) as StatusResult[]
  const alertCount = values.filter((s) => s.status === 'alert').length
  const watchCount = values.filter((s) => s.status === 'watch').length
  if (alertCount > 0) add(`${alertCount} domain${alertCount > 1 ? 's' : ''} at alert`, alertCount * 10)
  if (watchCount > 0) add(`${watchCount} domain${watchCount > 1 ? 's' : ''} at watch`, watchCount * 5)
  if (overdueCount > 0)
    add(`${overdueCount} overdue commitment${overdueCount > 1 ? 's' : ''}`, overdueCount * 5)

  const score = factors.reduce((sum, f) => sum + f.points, 0)
  // Sort factors by contribution, largest first (nicer hover breakdown).
  factors.sort((a, b) => b.points - a.points)
  return { score, factors }
}

/** Count sensor-domain statuses at each level (helper for badges). */
export function statusCounts(statuses: Partial<Record<DomainId, StatusResult>>): Record<DomainStatus, number> {
  const counts: Record<DomainStatus, number> = { stable: 0, watch: 0, alert: 0 }
  for (const s of Object.values(statuses)) if (s) counts[s.status]++
  return counts
}
