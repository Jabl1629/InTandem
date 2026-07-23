import type {
  ActionItem,
  DomainId,
  ManualDomainState,
  Reading,
  Resident,
} from '@/types'
import { daysUntil, daysSince } from '@/lib/dates'
import { SENSOR_DOMAIN_IDS } from '@/data/domains'
import { deltaSinceConference, type DeltaResult } from './deltas'
import { domainStatus, significantChange, type StatusResult } from './thresholds'
import { changeScore, type ChangeScoreResult } from './changeScore'
import { seriesFor, type Point } from './series'
import { DOMAINS } from '@/data/domains'

export interface DomainAssessment {
  domainId: DomainId
  status: StatusResult
  delta: DeltaResult | null
  series: Point[]
}

export interface ResidentAssessment {
  residentId: string
  sensor: Partial<Record<DomainId, DomainAssessment>>
  changeScore: ChangeScoreResult
  significant: { triggered: boolean; reason: string }
  overdueCount: number
  alertCount: number
  watchCount: number
}

/** True when an action item is effectively overdue (past due and not done). */
export function isOverdue(item: ActionItem): boolean {
  if (item.status === 'done') return false
  if (item.status === 'overdue') return true
  return daysUntil(item.dueDate) < 0
}

export interface AssessInput {
  resident: Resident
  readings: Reading[]
  manualStates: ManualDomainState[]
  actionItems: ActionItem[]
  hydrationGoal: number
}

/**
 * The single entry point the store/UI use. Composes per-domain thresholds,
 * the since-last-conference deltas, the significant-change trigger, and the
 * Change Score for one resident. Pure — deterministic in its inputs.
 */
export function assessResident({
  resident,
  readings,
  manualStates,
  actionItems,
  hydrationGoal,
}: AssessInput): ResidentAssessment {
  const sensor: Partial<Record<DomainId, DomainAssessment>> = {}
  const statuses: Partial<Record<DomainId, StatusResult>> = {}

  for (const id of SENSOR_DOMAIN_IDS) {
    const series = seriesFor(readings, resident.id, id)
    const status = domainStatus(id, series, { hydrationGoal })
    const delta = deltaSinceConference(series, resident.lastConferenceDate, DOMAINS[id])
    sensor[id] = { domainId: id, status, delta, series }
    statuses[id] = status
  }

  const overdueCount = actionItems.filter(
    (a) => a.residentId === resident.id && isOverdue(a),
  ).length

  const cs = changeScore(statuses, overdueCount)

  const fallState = manualStates.find(
    (m) => m.residentId === resident.id && m.domainId === 'falls',
  )
  const fallInLast30d = !!fallState?.lastEventISO && daysSince(fallState.lastEventISO) <= 30

  const statusList = Object.values(statuses)
    .filter(Boolean)
    .map((s) => (s as StatusResult).status)
  const significant = significantChange(statusList, fallInLast30d)

  const alertCount = statusList.filter((s) => s === 'alert').length
  const watchCount = statusList.filter((s) => s === 'watch').length

  return {
    residentId: resident.id,
    sensor,
    changeScore: cs,
    significant,
    overdueCount,
    alertCount,
    watchCount,
  }
}
