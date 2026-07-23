import type { Domain, DomainId } from '@/types'

/**
 * Domain catalog (spec §4.2). Six series get full trend cards with the
 * signature delta band; the rest render as a compact clinical checklist strip.
 * `provenance` is deliberately independent of `sensorBacked` — Nutrition is a
 * full trend card that is *staff-observed*, which makes the provenance
 * principle visible right on the richest cards.
 */
export const DOMAINS: Record<DomainId, Domain> = {
  mobility_gait: {
    id: 'mobility_gait',
    label: 'Gait speed',
    shortLabel: 'Gait',
    unit: 'm/s',
    provenance: 'sensor',
    sensorBacked: true,
    direction: 'up-good',
    precision: 2,
    source: 'GoSteady walker sensor',
    group: 'mobility',
  },
  mobility_activity: {
    id: 'mobility_activity',
    label: 'Daily walking distance',
    shortLabel: 'Activity',
    unit: 'm',
    provenance: 'sensor',
    sensorBacked: true,
    direction: 'up-good',
    precision: 0,
    source: 'GoSteady walker sensor',
    group: 'mobility',
  },
  weight: {
    id: 'weight',
    label: 'Weight',
    shortLabel: 'Weight',
    unit: 'lb',
    provenance: 'sensor',
    sensorBacked: true,
    direction: 'neutral',
    precision: 1,
    source: 'Connected scale',
    group: 'body',
  },
  hydration: {
    id: 'hydration',
    label: 'Hydration',
    shortLabel: 'Hydration',
    unit: 'mL',
    provenance: 'sensor',
    sensorBacked: true,
    direction: 'up-good',
    precision: 0,
    source: 'Smart water bottle',
    group: 'nutrition-hydration',
  },
  nutrition: {
    id: 'nutrition',
    label: 'Meal intake',
    shortLabel: 'Nutrition',
    unit: '%',
    provenance: 'staff',
    sensorBacked: true,
    direction: 'up-good',
    precision: 0,
    source: 'Dining staff entry',
    group: 'nutrition-hydration',
  },
  wellness: {
    id: 'wellness',
    label: 'Wellness & mood',
    shortLabel: 'Wellness',
    unit: '/5',
    provenance: 'sensor',
    sensorBacked: true,
    direction: 'up-good',
    precision: 1,
    source: 'Voice check-in',
    group: 'wellness',
  },

  // --- Manual clinical checklist strip (value + trend + last-updated) ---
  falls: {
    id: 'falls',
    label: 'Falls & incidents',
    shortLabel: 'Falls',
    unit: '',
    provenance: 'staff',
    sensorBacked: false,
    direction: 'down-good',
    precision: 0,
    source: 'Manual entry',
    group: 'clinical',
  },
  medications: {
    id: 'medications',
    label: 'Medications',
    shortLabel: 'Meds',
    unit: '',
    provenance: 'staff',
    sensorBacked: false,
    direction: 'neutral',
    precision: 0,
    source: 'Manual entry',
    group: 'clinical',
  },
  sleep: {
    id: 'sleep',
    label: 'Sleep',
    shortLabel: 'Sleep',
    unit: '',
    provenance: 'staff',
    sensorBacked: false,
    direction: 'neutral',
    precision: 0,
    source: 'Manual entry',
    group: 'clinical',
  },
  pain: {
    id: 'pain',
    label: 'Pain',
    shortLabel: 'Pain',
    unit: '/10',
    provenance: 'family',
    sensorBacked: false,
    direction: 'down-good',
    precision: 0,
    source: 'Staff + family reported',
    group: 'clinical',
  },
  adl: {
    id: 'adl',
    label: 'ADL function',
    shortLabel: 'ADL',
    unit: '',
    provenance: 'staff',
    sensorBacked: false,
    direction: 'neutral',
    precision: 0,
    source: 'Manual entry',
    group: 'clinical',
  },
  social: {
    id: 'social',
    label: 'Social engagement',
    shortLabel: 'Social',
    unit: '/wk',
    provenance: 'staff',
    sensorBacked: false,
    direction: 'up-good',
    precision: 0,
    source: 'Activities attendance',
    group: 'clinical',
  },
  skin: {
    id: 'skin',
    label: 'Skin integrity',
    shortLabel: 'Skin',
    unit: '',
    provenance: 'staff',
    sensorBacked: false,
    direction: 'neutral',
    precision: 0,
    source: 'Manual entry',
    group: 'clinical',
  },
}

/** Full trend-card domains, in display order. */
export const SENSOR_DOMAIN_IDS: DomainId[] = [
  'mobility_gait',
  'mobility_activity',
  'weight',
  'hydration',
  'nutrition',
  'wellness',
]

/** Manual clinical-strip domains, in display order. */
export const MANUAL_DOMAIN_IDS: DomainId[] = [
  'falls',
  'medications',
  'adl',
  'pain',
  'sleep',
  'social',
  'skin',
]

export const ALL_DOMAIN_IDS: DomainId[] = [...SENSOR_DOMAIN_IDS, ...MANUAL_DOMAIN_IDS]

export function domainMeta(id: DomainId): Domain {
  return DOMAINS[id]
}
