import type { DomainId } from '@/types'
import type { DomainAssessment } from '@/domain/assess'

export interface PlainStatus {
  text: string
  glyph: '↑' | '↓' | '→'
  tone: 'good' | 'watch'
}

/** Warm, plain-language phrasing per domain — the family projection of the
 * same objective record the IDT sees (spec §4.4). Never a separate dataset. */
const PHRASES: Record<DomainId, { good: string; concern: string }> = {
  mobility_gait: { good: 'Moving at a comfortable pace', concern: 'Moving a little more slowly than before' },
  mobility_activity: { good: 'Keeping active day to day', concern: 'Walking a bit less than last month' },
  weight: { good: 'Weight is holding steady', concern: 'Losing a little weight' },
  hydration: { good: 'Drinking water consistently', concern: 'Could use a little more water' },
  nutrition: { good: 'Eating well', concern: 'Eating a little less than usual' },
  wellness: { good: 'In good spirits', concern: 'Spirits have been a little low' },
  // Manual domains aren't shown as family tiles, but keep the map total.
  falls: { good: 'No recent falls', concern: 'A recent fall to keep an eye on' },
  medications: { good: 'Medications unchanged', concern: 'A change in medications' },
  sleep: { good: 'Sleeping normally', concern: 'Sleep has been disrupted' },
  pain: { good: 'Comfortable', concern: 'Some discomfort reported' },
  adl: { good: 'Managing daily tasks', concern: 'Needs a bit more help day to day' },
  social: { good: 'Enjoying activities', concern: 'Less involved in activities lately' },
  skin: { good: 'Skin is healthy', concern: 'Skin needs watching' },
}

export function plainStatus(da: DomainAssessment): PlainStatus {
  const status = da.status.status
  const improving = !!da.delta && !da.delta.adverse && da.delta.direction !== 'flat'
  const concern = status !== 'stable' && !improving
  const glyph = da.delta ? (da.delta.direction === 'up' ? '↑' : da.delta.direction === 'down' ? '↓' : '→') : '→'
  return {
    text: concern ? PHRASES[da.domainId].concern : PHRASES[da.domainId].good,
    glyph,
    tone: concern ? 'watch' : 'good',
  }
}
