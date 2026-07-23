import { useEffect } from 'react'
import type { DomainAssessment } from '@/domain/assess'
import type { Goal } from '@/types'
import { DOMAINS } from '@/data/domains'
import { DISPLAY_DAYS } from '@/data/generate'
import { latest } from '@/domain/series'
import { formatShort } from '@/lib/dates'
import { formatWithUnit } from '@/lib/format'
import { STATUS_LABEL, deltaTone, statusClasses, toneChartColor } from '@/lib/status'
import { ProvenanceIcon } from './ProvenanceIcon'
import { StatusChip } from './ui'
import { DeltaBand } from './DeltaBand'
import { Sparkline } from './Sparkline'

export function DomainDrawer({
  da,
  lastConferenceDate,
  goal,
  onClose,
}: {
  da: DomainAssessment
  lastConferenceDate: string
  goal?: Goal
  onClose: () => void
}) {
  const domain = DOMAINS[da.domainId]
  const status = da.status.status
  const tone = deltaTone(status, da.delta)
  const current = da.delta?.toValue ?? latest(da.series)?.value ?? 0
  const display = da.series.slice(-DISPLAY_DAYS)
  const recent = [...da.series].slice(-14).reverse()
  const sc = statusClasses(status)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-spruce/20 animate-fadein" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto scroll-quiet border-l bg-paper-raised shadow-pop animate-settle">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-soft">
              <ProvenanceIcon provenance={domain.provenance} />
              {domain.source}
            </div>
            <h2 className="mt-0.5 font-display text-xl font-semibold text-spruce">{domain.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate hover:bg-paper-sunken hover:text-spruce"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-end justify-between">
            <span className="font-display text-4xl font-semibold tnum text-spruce">
              {formatWithUnit(domain, current)}
            </span>
            <StatusChip status={status} />
          </div>
          <div className="mt-2">
            <DeltaBand domain={domain} delta={da.delta} tone={tone} size="lg" />
          </div>

          <div className="mt-4 rounded-lg border bg-paper p-2">
            <Sparkline data={display} refDate={lastConferenceDate} color={toneChartColor(tone)} height={190} showRefLabel />
          </div>

          {/* Threshold annotation — the defensible "why" */}
          <div className={`mt-4 rounded-lg border-l-4 ${sc.borderLeft} ${sc.wash} px-3 py-2.5`}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate">
              {STATUS_LABEL[status]} — why
            </div>
            <div className="mt-0.5 text-sm text-spruce">{da.status.reason}</div>
          </div>

          {goal && (
            <div className="mt-3 rounded-lg border bg-glacier-wash px-3 py-2.5">
              <div className="text-xs font-medium text-glacier-ink">Linked goal</div>
              <div className="mt-0.5 text-sm text-spruce">{goal.plainLanguage}</div>
              <div className="mt-0.5 text-xs text-slate">Target: {goal.targetMetric}</div>
            </div>
          )}

          <div className="mt-4">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-soft">
              Recent readings
            </div>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <tbody>
                  {recent.map((p, i) => (
                    <tr key={p.date} className={i % 2 ? 'bg-paper' : 'bg-paper-raised'}>
                      <td className="px-3 py-1.5 text-slate">{formatShort(p.date)}</td>
                      <td className="px-3 py-1.5 text-right tnum font-medium text-spruce">
                        {formatWithUnit(domain, p.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
