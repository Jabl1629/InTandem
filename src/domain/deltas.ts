import type { Domain } from '@/types'
import { lastNMean, latest, meanAround, type Point } from './series'

export interface DeltaResult {
  fromValue: number
  toValue: number
  absolute: number
  pct: number
  fromDate: string // last conference date — the reference line
  direction: 'up' | 'down' | 'flat'
  /** is this change in the clinically adverse direction for this domain? */
  adverse: boolean
}

const FLAT_EPS = 0.0005 // relative epsilon for "no meaningful change"

/**
 * The signature metric: change since the last conference. Baseline is the
 * mean of readings around the last-conference date (robust to a single noisy
 * day); "current" is the trailing 7-reading mean. This is the number rendered
 * large in the delta band and quoted to families — keep it stable and simple.
 */
export function deltaSinceConference(
  series: Point[],
  lastConferenceISO: string,
  domain: Domain,
): DeltaResult | null {
  if (series.length < 2) return null
  const baseline = meanAround(series, lastConferenceISO, 4)
  const current = lastNMean(series, 7) ?? latest(series)?.value
  if (baseline === undefined || current === undefined) return null

  const absolute = current - baseline
  const pct = baseline !== 0 ? (absolute / Math.abs(baseline)) * 100 : 0
  const rel = baseline !== 0 ? Math.abs(absolute) / Math.abs(baseline) : 0
  const direction = rel < FLAT_EPS ? 'flat' : absolute > 0 ? 'up' : 'down'

  return {
    fromValue: baseline,
    toValue: current,
    absolute,
    pct,
    fromDate: lastConferenceISO,
    direction,
    adverse: isAdverse(domain, absolute),
  }
}

/** Whether a signed change is in the clinically concerning direction. */
export function isAdverse(domain: Domain, absolute: number): boolean {
  if (Math.abs(absolute) < 1e-9) return false
  // Weight is modeled 'neutral' for arrow polarity, but unintended loss is the risk.
  if (domain.id === 'weight') return absolute < 0
  if (domain.direction === 'up-good') return absolute < 0
  if (domain.direction === 'down-good') return absolute > 0
  return false
}
