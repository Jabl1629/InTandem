import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { assessAll, residents } from '@/store/selectors'
import { DOMAINS } from '@/data/domains'
import { daysUntil } from '@/lib/dates'
import { Avatar } from '@/components/Avatar'
import { CareLevelBadge, Chip } from '@/components/ui'
import { ChangeScoreBadge } from '@/components/ChangeScore'
import { statusClasses } from '@/lib/status'
import type { ResidentAssessment } from '@/domain/assess'
import type { CareLevel, DomainId } from '@/types'

const CARE_LEVELS: CareLevel[] = ['IL', 'AL', 'MC', 'SNF']

function FilterToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'border-spruce bg-spruce text-white' : 'text-slate hover:bg-paper-sunken'
      }`}
    >
      {children}
    </button>
  )
}

function DomainChips({ a }: { a: ResidentAssessment }) {
  const chips = (['alert', 'watch'] as const).flatMap((level) =>
    (Object.keys(a.sensor) as DomainId[])
      .filter((id) => a.sensor[id]!.status.status === level)
      .map((id) => ({ id, level })),
  )
  if (!chips.length) return <span className="text-xs text-slate-soft">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {chips.slice(0, 4).map(({ id, level }) => (
        <Chip key={id} className={statusClasses(level).chip}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusClasses(level).dot}`} />
          {DOMAINS[id].shortLabel}
        </Chip>
      ))}
    </div>
  )
}

export function RoundingBoard() {
  const navigate = useNavigate()
  const actionItems = useStore((s) => s.actionItems)
  const assessments = useMemo(() => assessAll(actionItems), [actionItems])

  const ranked = useMemo(
    () =>
      [...residents].sort(
        (a, b) => (assessments[b.id]?.changeScore.score ?? 0) - (assessments[a.id]?.changeScore.score ?? 0),
      ),
    [assessments],
  )

  const flagged = ranked.filter((r) => assessments[r.id]?.significant.triggered)

  const [careFilter, setCareFilter] = useState<'all' | CareLevel>('all')
  const [dueSoon, setDueSoon] = useState(false)
  const [hasOverdue, setHasOverdue] = useState(false)
  const [hasAlerts, setHasAlerts] = useState(false)

  const visible = ranked.filter((r) => {
    const a = assessments[r.id]!
    if (careFilter !== 'all' && r.careLevel !== careFilter) return false
    if (dueSoon && daysUntil(r.nextConferenceDate) > 30) return false
    if (hasOverdue && a.overdueCount === 0) return false
    if (hasAlerts && a.alertCount === 0) return false
    return true
  })

  return (
    <div className="mx-auto max-w-shell px-7 py-6">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-semibold text-spruce">Rounding Board</h1>
        <p className="mt-0.5 text-sm text-slate">
          Monday stand-up · {residents.length} residents · sorted by who changed most since we last looked.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-full border bg-paper p-0.5 text-xs font-medium">
          <button
            onClick={() => setCareFilter('all')}
            className={`rounded-full px-3 py-1 transition-colors ${careFilter === 'all' ? 'bg-spruce text-white' : 'text-slate'}`}
          >
            All levels
          </button>
          {CARE_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setCareFilter(lvl)}
              className={`rounded-full px-3 py-1 transition-colors ${careFilter === lvl ? 'bg-spruce text-white' : 'text-slate'}`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <span className="mx-1 h-4 w-px bg-line" />
        <FilterToggle active={dueSoon} onClick={() => setDueSoon((v) => !v)}>
          Conference due ≤ 30d
        </FilterToggle>
        <FilterToggle active={hasOverdue} onClick={() => setHasOverdue((v) => !v)}>
          Has overdue commitments
        </FilterToggle>
        <FilterToggle active={hasAlerts} onClick={() => setHasAlerts((v) => !v)}>
          Has alerts
        </FilterToggle>
      </div>

      {/* Significant-change banner(s) */}
      {flagged.map((r) => {
        const a = assessments[r.id]!
        return (
          <button
            key={r.id}
            onClick={() => navigate(`/resident/${r.id}`)}
            className="mb-3 flex w-full items-center gap-3 rounded-lg border border-l-4 border-l-alert bg-alert-wash px-4 py-3 text-left transition-shadow hover:shadow-card"
          >
            <span className="text-alert" aria-hidden>
              ⚠
            </span>
            <span className="text-sm text-spruce">
              <span className="font-semibold">{r.name}</span> has crossed thresholds —{' '}
              {a.significant.reason}. A significant-change conference is recommended.
            </span>
            <span className="ml-auto rounded-md bg-alert px-3 py-1 text-xs font-semibold text-white">
              Schedule →
            </span>
          </button>
        )
      })}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-paper-raised shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-paper text-left text-[11px] uppercase tracking-wide text-slate-soft">
              <th className="w-10 py-2.5 pl-4 font-semibold">#</th>
              <th className="py-2.5 font-semibold">Resident</th>
              <th className="py-2.5 font-semibold">Level</th>
              <th className="py-2.5 text-center font-semibold">Change</th>
              <th className="py-2.5 font-semibold">Active flags</th>
              <th className="py-2.5 font-semibold">Next conf.</th>
              <th className="py-2.5 pr-4 text-center font-semibold">Overdue</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-soft">
                  No residents match these filters.
                </td>
              </tr>
            )}
            {visible.map((r, i) => {
              const a = assessments[r.id]!
              const days = daysUntil(r.nextConferenceDate)
              return (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/resident/${r.id}`)}
                  className="cursor-pointer border-b last:border-0 transition-colors hover:bg-paper-sunken/50"
                >
                  <td className="py-3 pl-4 tnum text-slate-soft">{i + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} size={38} />
                      <div>
                        <div className="font-medium text-spruce">{r.name}</div>
                        <div className="text-xs text-slate-soft">
                          Room {r.room} · Age {r.age}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <CareLevelBadge level={r.careLevel} />
                  </td>
                  <td className="py-3 text-center">
                    <ChangeScoreBadge result={a.changeScore} />
                  </td>
                  <td className="py-3">
                    <DomainChips a={a} />
                  </td>
                  <td className="py-3">
                    <span className={days <= 7 ? 'font-medium text-watch-ink' : 'text-slate'}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-center">
                    {a.overdueCount > 0 ? (
                      <span className="tnum inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-alert-wash px-1.5 text-xs font-semibold text-alert-ink">
                        {a.overdueCount}
                      </span>
                    ) : (
                      <span className="text-slate-soft">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
