import type { ManualDomainState } from '@/types'
import { DOMAINS } from '@/data/domains'
import { daysSince, formatShort } from '@/lib/dates'
import { statusClasses } from '@/lib/status'
import { ProvenanceIcon } from './ProvenanceIcon'

const STALE_DAYS = 14

function TrendArrow({ trend }: { trend: ManualDomainState['trend'] }) {
  if (trend === 'none') return null
  const glyph = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '▬'
  return (
    <span className="text-[11px] text-slate-soft" aria-hidden>
      {glyph}
    </span>
  )
}

function ManualCell({ m }: { m: ManualDomainState }) {
  const domain = DOMAINS[m.domainId]
  const age = daysSince(m.lastUpdatedISO)
  const stale = age > STALE_DAYS
  const sc = statusClasses(m.status)
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-paper p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-soft">
        <ProvenanceIcon provenance={domain.provenance} />
        <span className="truncate">{domain.label}</span>
        {m.status !== 'stable' && <span className={`ml-auto h-1.5 w-1.5 rounded-full ${sc.dot}`} />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-spruce">{m.displayValue}</span>
        <TrendArrow trend={m.trend} />
      </div>
      <div
        className={`flex items-center gap-1 text-[10.5px] ${
          stale ? 'font-medium text-watch-ink' : 'text-slate-soft'
        }`}
        title={stale ? 'This value is stale — data-entry burden shows up here.' : undefined}
      >
        {stale && (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.2l2 1.3" />
          </svg>
        )}
        Updated {formatShort(m.lastUpdatedISO)} · {age}d ago
      </div>
    </div>
  )
}

export function ManualStrip({ states }: { states: ManualDomainState[] }) {
  if (!states.length) return null
  return (
    <div className="rounded-lg border bg-paper-raised p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-spruce">Clinical checklist</h3>
        <span className="text-xs text-slate-soft">Hand-entered · value, trend, and when it was last updated</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {states.map((m) => (
          <ManualCell key={m.domainId} m={m} />
        ))}
      </div>
    </div>
  )
}
