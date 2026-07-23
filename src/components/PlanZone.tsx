import type { Goal } from '@/types'
import type { ResidentAssessment } from '@/domain/assess'
import { DOMAINS } from '@/data/domains'
import { latest } from '@/domain/series'
import { formatWithUnit } from '@/lib/format'
import { FamiliesSeeThis, OwnerChip } from './ui'

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

/** Live current value for a goal, fed from Zone A where the domain is sensor-backed. */
function goalCurrent(goal: Goal, assessment: ResidentAssessment): number {
  const da = assessment.sensor[goal.domainId]
  if (da) return da.delta?.toValue ?? latest(da.series)?.value ?? goal.currentValue
  return goal.currentValue
}

function GoalRow({ goal, assessment }: { goal: Goal; assessment: ResidentAssessment }) {
  const domain = DOMAINS[goal.domainId]
  const current = goalCurrent(goal, assessment)
  const progress = clamp01(current / goal.targetValue)
  const da = assessment.sensor[goal.domainId]
  const onTrack = da ? da.status.status === 'stable' : current >= goal.targetValue * 0.9

  return (
    <div className="border-b p-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-spruce">{goal.plainLanguage}</div>
          <div className="mt-0.5 text-xs text-slate">
            {domain.label} · target: {goal.targetMetric}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            onTrack ? 'bg-stable-wash text-stable-ink' : 'bg-watch-wash text-watch-ink'
          }`}
        >
          {onTrack ? 'On track' : 'Needs attention'}
        </span>
      </div>

      {/* Live progress bar fed by Zone A */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-sunken">
          <div
            className={`h-full rounded-full ${onTrack ? 'bg-stable' : 'bg-glacier'}`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="tnum w-28 text-right text-xs text-slate">
          {formatWithUnit(domain, current)} / {formatWithUnit(domain, goal.targetValue)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ul className="flex flex-wrap gap-1.5">
          {goal.interventions.map((iv) => (
            <li key={iv} className="rounded-md bg-paper-sunken px-2 py-0.5 text-xs text-slate">
              {iv}
            </li>
          ))}
        </ul>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-soft">
          Owner: <OwnerChip staff={goal.owner} />
        </span>
      </div>
    </div>
  )
}

export function PlanZone({ goals, assessment }: { goals: Goal[]; assessment: ResidentAssessment }) {
  if (!goals.length) {
    return (
      <div className="rounded-lg border border-dashed bg-paper p-6 text-sm text-slate-soft">
        No active plan goals.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-paper-raised shadow-card">
      <div className="flex items-center justify-between border-b bg-paper px-4 py-2.5">
        <span className="text-sm font-medium text-spruce">
          {goals.length} active goal{goals.length > 1 ? 's' : ''}
        </span>
        <FamiliesSeeThis />
      </div>
      {goals.map((g) => (
        <GoalRow key={g.id} goal={g} assessment={assessment} />
      ))}
    </div>
  )
}
