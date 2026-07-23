import { describe, expect, it } from 'vitest'
import { daysAgoISO } from '@/lib/dates'
import type { Point } from './series'
import {
  activityStatus,
  gaitStatus,
  hydrationStatus,
  nutritionStatus,
  significantChange,
  weightStatus,
  wellnessStatus,
} from './thresholds'

/** Build a series where the last element is today, working backwards. */
const series = (vals: number[]): Point[] =>
  vals.map((v, i) => ({ date: daysAgoISO(vals.length - 1 - i), value: v }))

/** Build a 190-day series from a function of days-ago. */
const longSeries = (fn: (daysAgo: number) => number, n = 190): Point[] => {
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const daysAgo = n - 1 - i
    out.push({ date: daysAgoISO(daysAgo), value: fn(daysAgo) })
  }
  return out
}

describe('weightStatus (CMS thresholds)', () => {
  it('alerts on ≥5% loss in 30 days', () => {
    // Loss reached ~a week ago and now holding (a sustained ≥5% loss).
    const s = longSeries((d) => (d > 30 ? 150 : 150 * (1 - 0.055 * Math.min(1, (30 - d) / 24))))
    expect(weightStatus(s).status).toBe('alert')
  })
  it('watches on 3–4.9% loss in 30 days', () => {
    const s = longSeries((d) => (d > 30 ? 150 : 150 * (1 - 0.04 * Math.min(1, (30 - d) / 24))))
    expect(weightStatus(s).status).toBe('watch')
  })
  it('alerts on ≥10% loss over 180 days even if 30-day is quiet', () => {
    const s = longSeries((d) => 150 * (1 - 0.11 * ((180 - Math.min(d, 180)) / 180)))
    expect(weightStatus(s).status).toBe('alert')
  })
  it('stays stable when flat', () => {
    expect(weightStatus(longSeries(() => 150)).status).toBe('stable')
  })
})

describe('gaitStatus', () => {
  it('alerts on >0.1 m/s decline over 30 days', () => {
    const s = longSeries((d) => (d > 35 ? 0.85 : 0.85 - 0.16 * ((35 - d) / 35)))
    expect(gaitStatus(s).status).toBe('alert')
  })
  it('watches on 0.05–0.1 m/s decline', () => {
    const s = longSeries((d) => (d > 40 ? 0.85 : 0.85 - 0.08 * ((40 - d) / 40)))
    expect(gaitStatus(s).status).toBe('watch')
  })
})

describe('activityStatus', () => {
  it('alerts on 3+ zero-use days in the week', () => {
    const vals = Array.from({ length: 40 }, () => 350)
    vals[39] = 0
    vals[37] = 0
    vals[35] = 0
    expect(activityStatus(series(vals)).status).toBe('alert')
  })
  it('watches on >25% drop vs prior 30-day average', () => {
    const s = longSeries((d) => (d < 7 ? 240 : 350), 50)
    expect(activityStatus(s).status).toBe('watch')
  })
})

describe('hydrationStatus', () => {
  it('alerts when under 70% of goal on 5+ of last 7 days', () => {
    const vals = [1500, 1500, 1500, 900, 900, 900, 900, 900]
    expect(hydrationStatus(series(vals), 1500).status).toBe('alert')
  })
  it('watches on 3–4 low days', () => {
    const vals = [1500, 1500, 1500, 1500, 900, 900, 900]
    expect(hydrationStatus(series(vals), 1500).status).toBe('watch')
  })
})

describe('nutritionStatus', () => {
  it('alerts on <50% intake for 3 consecutive days', () => {
    expect(nutritionStatus(series([80, 80, 45, 45, 45])).status).toBe('alert')
  })
  it('watches on <75% average over 3 days', () => {
    expect(nutritionStatus(series([80, 70, 70, 70])).status).toBe('watch')
  })
})

describe('wellnessStatus', () => {
  it('alerts on 3+ low-mood flags in 7 days', () => {
    expect(wellnessStatus(series([4, 2, 2, 2])).status).toBe('alert')
  })
  it('watches on low completion', () => {
    // only 3 readings in the trailing week → completion < 60%
    const s: Point[] = [
      { date: daysAgoISO(6), value: 4 },
      { date: daysAgoISO(3), value: 4 },
      { date: daysAgoISO(1), value: 4 },
    ]
    expect(wellnessStatus(s).status).toBe('watch')
  })
})

describe('significantChange trigger', () => {
  it('fires on ≥2 alert domains', () => {
    expect(significantChange(['alert', 'alert', 'stable'], false).triggered).toBe(true)
  })
  it('fires on 1 alert + a recent fall', () => {
    expect(significantChange(['alert', 'watch'], true).triggered).toBe(true)
  })
  it('does not fire on 1 alert with no fall', () => {
    expect(significantChange(['alert', 'watch'], false).triggered).toBe(false)
  })
})
