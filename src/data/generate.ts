import type { DomainId, Provenance, Reading } from '@/types'
import { addDays, DEMO_TODAY, isoDate } from '@/lib/dates'
import { Rng } from '@/lib/rng'

/** Days of history generated per sensor series. The UI displays the last 90;
 * the extra tail lets the 180-day CMS weight threshold be computed for real. */
export const HISTORY_DAYS = 190
export const DISPLAY_DAYS = 90

/** The generation plan for one resident's sensor domains. Arcs are authored
 * so the deterministic thresholds fire exactly as each narrative requires. */
export interface SensorPlan {
  gaitBase: number
  gaitArc?: { type: 'decline'; window: number; total: number } | { type: 'rehab'; startDrop: number; window: number }

  activityBase: number
  activityArc?:
    | { type: 'decline'; dropPct: number; window: number; zeroDaysLastWeek?: number }
    | { type: 'rehab'; startFrac: number; window: number }

  weightBase: number
  weightLoss30Pct?: number // % of body weight lost over the last 30 days

  hydrationBase: number
  hydrationGoal: number
  hydrationLowDaysLastWeek?: number // days forced under 70% of goal in the last 7

  nutritionBase: number
  nutritionArc?: { type: 'dip'; to: number; window: number }

  wellnessBase: number
  wellnessCompletion: number // 0..1 probability a day's check-in exists
  wellnessAnxietyDaysLastWeek?: number // low-mood readings forced into the last 7
}

/** The 190-day date axis ending at the demo "today" (oldest → newest). */
export function axis(): string[] {
  const out: string[] = []
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) out.push(isoDate(addDays(DEMO_TODAY, -i)))
  return out
}

const LEN = HISTORY_DAYS

/** 0 at `window` days before the end, ramping to 1 at the end (today). */
function rampProgress(index: number, window: number): number {
  const dayFromEnd = LEN - 1 - index
  if (dayFromEnd >= window) return 0
  return (window - dayFromEnd) / window
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function genGait(rng: Rng, plan: SensorPlan): number[] {
  const { gaitBase, gaitArc } = plan
  return axis().map((_, i) => {
    let v = gaitBase + rng.normal(0, 0.03)
    if (gaitArc?.type === 'decline') {
      v -= gaitArc.total * rampProgress(i, gaitArc.window)
    } else if (gaitArc?.type === 'rehab') {
      // started slow, climbing to base by today
      v -= gaitArc.startDrop * (1 - rampProgress(i, gaitArc.window))
    }
    return clamp(v, 0.2, 1.6)
  })
}

function genActivity(rng: Rng, plan: SensorPlan): number[] {
  const { activityBase, activityArc } = plan
  const zeroSet = new Set<number>()
  if (activityArc?.type === 'decline' && activityArc.zeroDaysLastWeek) {
    for (let k = 0; k < activityArc.zeroDaysLastWeek; k++) zeroSet.add(LEN - 1 - (1 + k * 2))
  }
  return axis().map((_, i) => {
    if (zeroSet.has(i)) return rng.range(0, 12)
    let v = activityBase + rng.normal(0, activityBase * 0.14)
    if (activityArc?.type === 'decline') {
      v *= 1 - (activityArc.dropPct / 100) * rampProgress(i, activityArc.window)
    } else if (activityArc?.type === 'rehab') {
      v *= activityArc.startFrac + (1 - activityArc.startFrac) * rampProgress(i, activityArc.window)
    }
    return Math.max(0, Math.round(v))
  })
}

function genWeight(rng: Rng, plan: SensorPlan): number[] {
  const { weightBase, weightLoss30Pct = 0 } = plan
  const target = weightBase * (1 - weightLoss30Pct / 100)
  return axis().map((_, i) => {
    // Reach the full loss ~6 days before today, then plateau — models a
    // weight that "crossed the threshold this week" and is now holding, so the
    // 30-day loss reads robustly at the CMS threshold rather than teetering.
    const p = Math.min(1, rampProgress(i, 30) * 1.25)
    const base = weightBase + (target - weightBase) * p
    return +(base + rng.normal(0, 0.3)).toFixed(1)
  })
}

function genHydration(rng: Rng, plan: SensorPlan): number[] {
  const { hydrationBase, hydrationGoal, hydrationLowDaysLastWeek = 0 } = plan
  const lowSet = new Set<number>()
  for (let k = 0; k < hydrationLowDaysLastWeek; k++) lowSet.add(LEN - 1 - (1 + k))
  return axis().map((_, i) => {
    if (lowSet.has(i)) return Math.round(hydrationGoal * rng.range(0.5, 0.66))
    return Math.max(200, Math.round(hydrationBase + rng.normal(0, 130)))
  })
}

function genNutrition(rng: Rng, plan: SensorPlan): number[] {
  const { nutritionBase, nutritionArc } = plan
  return axis().map((_, i) => {
    let v = nutritionBase + rng.normal(0, 6)
    if (nutritionArc?.type === 'dip') {
      v = nutritionBase + (nutritionArc.to - nutritionBase) * rampProgress(i, nutritionArc.window) + rng.normal(0, 5)
    }
    return clamp(Math.round(v), 0, 100)
  })
}

/** Wellness returns sparse readings (missing days = skipped check-ins). */
function genWellness(rng: Rng, plan: SensorPlan): (number | null)[] {
  const { wellnessBase, wellnessCompletion, wellnessAnxietyDaysLastWeek = 0 } = plan
  const anxSet = new Set<number>()
  for (let k = 0; k < wellnessAnxietyDaysLastWeek; k++) anxSet.add(LEN - 1 - (1 + k * 2))
  return axis().map((_, i) => {
    const inLastWeek = LEN - 1 - i < 7
    // Force presence on forced-anxiety days; otherwise honor completion rate.
    const present = anxSet.has(i) || rng.chance(inLastWeek && plan.wellnessCompletion < 0.7 ? wellnessCompletion : Math.max(wellnessCompletion, 0.75))
    if (!present) return null
    if (anxSet.has(i)) return clamp(Math.round(rng.range(1, 2.5)), 1, 5)
    return clamp(Math.round(wellnessBase + rng.normal(0, 0.7)), 1, 5)
  })
}

const PROVENANCE: Record<DomainId, Provenance> = {
  mobility_gait: 'sensor',
  mobility_activity: 'sensor',
  weight: 'sensor',
  hydration: 'sensor',
  nutrition: 'staff',
  wellness: 'sensor',
  falls: 'staff',
  medications: 'staff',
  sleep: 'staff',
  pain: 'family',
  adl: 'staff',
  social: 'staff',
  skin: 'staff',
}

/** Generate all sensor readings for one resident from their plan. */
export function generateReadings(residentId: string, plan: SensorPlan): Reading[] {
  const dates = axis()
  const readings: Reading[] = []

  const push = (domainId: DomainId, values: (number | null)[]) => {
    values.forEach((v, i) => {
      if (v === null) return
      readings.push({ residentId, domainId, date: dates[i], value: v, provenance: PROVENANCE[domainId] })
    })
  }

  // Independent seeded stream per resident+domain → stable, reproducible series.
  push('mobility_gait', genGait(new Rng(`${residentId}:gait`), plan))
  push('mobility_activity', genActivity(new Rng(`${residentId}:act`), plan))
  push('weight', genWeight(new Rng(`${residentId}:wt`), plan))
  push('hydration', genHydration(new Rng(`${residentId}:hyd`), plan))
  push('nutrition', genNutrition(new Rng(`${residentId}:nut`), plan))
  push('wellness', genWellness(new Rng(`${residentId}:wel`), plan))

  return readings
}
