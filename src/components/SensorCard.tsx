import type { DomainAssessment } from '@/domain/assess'
import type { Goal } from '@/types'
import { DOMAINS } from '@/data/domains'
import { DISPLAY_DAYS } from '@/data/generate'
import { latest } from '@/domain/series'
import { formatWithUnit } from '@/lib/format'
import { deltaTone, statusClasses, toneChartColor } from '@/lib/status'
import { ProvenanceIcon } from './ProvenanceIcon'
import { StatusChip } from './ui'
import { DeltaBand } from './DeltaBand'
import { Sparkline } from './Sparkline'

export function SensorCard({
  da,
  lastConferenceDate,
  goal,
  onOpen,
}: {
  da: DomainAssessment
  lastConferenceDate: string
  goal?: Goal
  onOpen: () => void
}) {
  const domain = DOMAINS[da.domainId]
  const status = da.status.status
  const tone = deltaTone(status, da.delta)
  const current = da.delta?.toValue ?? latest(da.series)?.value ?? 0
  const display = da.series.slice(-DISPLAY_DAYS)
  const sc = statusClasses(status)

  return (
    <button
      onClick={onOpen}
      className={`group flex flex-col rounded-lg border border-l-4 ${sc.borderLeft} bg-paper-raised p-4 text-left shadow-card transition-shadow hover:shadow-raised`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-soft">
            <ProvenanceIcon provenance={domain.provenance} />
            <span className="truncate">{domain.source}</span>
          </div>
          <div className="mt-0.5 font-medium text-spruce">{domain.label}</div>
        </div>
        <StatusChip status={status} />
      </div>

      <div className="mt-3 font-display text-3xl font-semibold tnum text-spruce">
        {formatWithUnit(domain, current)}
      </div>

      <div className="mt-1">
        <DeltaBand domain={domain} delta={da.delta} tone={tone} />
      </div>

      <div className="mt-2">
        <Sparkline data={display} refDate={lastConferenceDate} color={toneChartColor(tone)} />
      </div>

      {goal && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-glacier-wash px-2 py-1 text-[11px] font-medium text-glacier-ink">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <circle cx="8" cy="8" r="5.5" />
            <circle cx="8" cy="8" r="1.5" />
          </svg>
          <span className="truncate">Goal: {goal.targetMetric}</span>
        </div>
      )}
    </button>
  )
}
