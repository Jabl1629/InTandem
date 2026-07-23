import type { CareLevel, DomainStatus } from '@/types'

export const STATUS_LABEL: Record<DomainStatus, string> = {
  stable: 'Stable',
  watch: 'Watch',
  alert: 'Alert',
}

export interface StatusClasses {
  text: string
  dot: string
  wash: string
  chip: string
  borderLeft: string
}

/** Consistent status color mapping. Status colors are used ONLY for status. */
export function statusClasses(status: DomainStatus): StatusClasses {
  switch (status) {
    case 'alert':
      return {
        text: 'text-alert',
        dot: 'bg-alert',
        wash: 'bg-alert-wash',
        chip: 'bg-alert-wash text-alert-ink',
        borderLeft: 'border-l-alert',
      }
    case 'watch':
      return {
        text: 'text-watch',
        dot: 'bg-watch',
        wash: 'bg-watch-wash',
        chip: 'bg-watch-wash text-watch-ink',
        borderLeft: 'border-l-watch',
      }
    default:
      return {
        text: 'text-stable',
        dot: 'bg-stable',
        wash: 'bg-stable-wash',
        chip: 'bg-stable-wash text-stable-ink',
        borderLeft: 'border-l-stable',
      }
  }
}

export type DeltaTone = 'alert' | 'watch' | 'improve' | 'flat'

/** Resolve the delta band's tone: adverse moves take the domain's status color,
 * improvements go moss, negligible/flat goes quiet slate. */
export function deltaTone(
  status: DomainStatus,
  delta: { adverse: boolean; direction: 'up' | 'down' | 'flat' } | null,
): DeltaTone {
  if (!delta || delta.direction === 'flat') return 'flat'
  if (!delta.adverse) return 'improve'
  return status === 'alert' ? 'alert' : status === 'watch' ? 'watch' : 'flat'
}

export function toneTextClass(tone: DeltaTone): string {
  return tone === 'alert' ? 'text-alert' : tone === 'watch' ? 'text-watch' : tone === 'improve' ? 'text-stable' : 'text-slate'
}

export function toneChartColor(tone: DeltaTone): string {
  return tone === 'alert'
    ? 'var(--alert)'
    : tone === 'watch'
      ? 'var(--watch)'
      : tone === 'improve'
        ? 'var(--stable)'
        : 'var(--slate)'
}

export const CARE_LEVEL_LABEL: Record<CareLevel, string> = {
  IL: 'Independent Living',
  AL: 'Assisted Living',
  MC: 'Memory Care',
  SNF: 'Skilled Nursing',
}
