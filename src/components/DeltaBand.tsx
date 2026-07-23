import type { Domain } from '@/types'
import type { DeltaResult } from '@/domain/deltas'
import { formatShort } from '@/lib/dates'
import { deltaArrow, formatDeltaAbs, formatDeltaPct } from '@/lib/format'
import { toneTextClass, type DeltaTone } from '@/lib/status'

/**
 * The signature "delta band": a consistent, prominent stamp of the change
 * since the last conference (arrow + % + "since May 14"). Rendered identically
 * on every sensor card — the product's argument lives in this one device.
 */
export function DeltaBand({
  domain,
  delta,
  tone,
  size = 'md',
}: {
  domain: Domain
  delta: DeltaResult | null
  tone: DeltaTone
  size?: 'md' | 'lg'
}) {
  if (!delta || delta.direction === 'flat') {
    return (
      <div className="flex items-baseline gap-1.5 text-slate">
        <span className="text-slate-soft">▬</span>
        <span className={size === 'lg' ? 'text-lg font-medium' : 'text-sm font-medium'}>No change</span>
        {delta && <span className="text-xs text-slate-soft">since {formatShort(delta.fromDate)}</span>}
      </div>
    )
  }
  const pctSize = size === 'lg' ? 'text-3xl' : 'text-2xl'
  return (
    <div className={`flex items-baseline gap-1.5 ${toneTextClass(tone)}`}>
      <span className={size === 'lg' ? 'text-xl' : 'text-base'} aria-hidden>
        {deltaArrow(delta.direction)}
      </span>
      <span className={`font-display font-semibold tnum ${pctSize}`}>{formatDeltaPct(delta.pct)}</span>
      <span className="text-xs font-medium text-slate">
        {deltaArrow(delta.direction)} {formatDeltaAbs(domain, delta.absolute)} since {formatShort(delta.fromDate)}
      </span>
    </div>
  )
}
