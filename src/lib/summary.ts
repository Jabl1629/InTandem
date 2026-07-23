import type { ActionItem, Conference, FamilyQuestion, FamilySummary, Resident } from '@/types'
import type { ResidentAssessment } from '@/domain/assess'
import type { AgendaItem } from './agenda'
import { DOMAINS, SENSOR_DOMAIN_IDS } from '@/data/domains'
import { formatShort } from './dates'
import { formatDeltaPct } from './format'

/** Plain-language line for a domain that moved since the last conference. */
function changeLine(label: string, direction: 'up' | 'down' | 'flat', pct: number, since: string): string {
  const verb = direction === 'up' ? 'up' : 'down'
  return `${label}: ${verb} ${formatDeltaPct(pct)} since ${formatShort(since)}`
}

/**
 * Assemble the Family Summary from what happened in the meeting (spec §4.3):
 * what we reviewed, what changed, what we decided, who's doing what by when,
 * questions & answers, next conference date.
 */
export function buildSummaryInput(
  resident: Resident,
  assessment: ResidentAssessment,
  conference: Conference,
  actionItems: ActionItem[],
  questions: FamilyQuestion[],
  agenda: AgendaItem[],
  checkedIds: string[],
): Omit<FamilySummary, 'id' | 'date'> {
  const reviewedItems = agenda.filter((a) => checkedIds.includes(a.id))
  const reviewed = (reviewedItems.length ? reviewedItems : agenda).map((a) => a.title)

  const changed = SENSOR_DOMAIN_IDS.map((id) => assessment.sensor[id])
    .filter((da) => da && da.delta && da.delta.direction !== 'flat')
    .map((da) => changeLine(DOMAINS[da!.domainId].label, da!.delta!.direction, da!.delta!.pct, da!.delta!.fromDate))

  const newItems = actionItems.filter((a) => a.createdInConferenceId === conference.id)

  const questionsAnswered = questions
    .filter((q) => q.answer)
    .map((q) => ({ question: q.question, answer: q.answer! }))

  return {
    residentId: resident.id,
    conferenceId: conference.id,
    reviewed,
    changed,
    decisions: conference.decisions.map((d) => d.text),
    actionItems: newItems.map((a) => ({ description: a.description, owner: a.owner.name, dueDate: a.dueDate })),
    questionsAnswered,
    nextConferenceDate: resident.nextConferenceDate,
  }
}
