import type { ActionItem, DomainId, FamilyQuestion } from '@/types'
import type { ResidentAssessment } from '@/domain/assess'
import { isOverdue } from '@/domain/assess'
import { DOMAINS, SENSOR_DOMAIN_IDS } from '@/data/domains'
import { STATUS_LABEL } from '@/lib/status'

export type AgendaKind = 'domain' | 'commitment' | 'question'

export interface AgendaItem {
  id: string
  kind: AgendaKind
  title: string
  detail?: string
  domainId?: DomainId
}

/**
 * The pre-meeting agenda, auto-built from the objective record (spec §4.3):
 * every watch/alert domain, every overdue commitment, every open family
 * question — in priority order. Shared by the pre-meeting brief and Conference
 * Mode so the meeting runs exactly what the brief promised.
 */
export function buildAgenda(
  assessment: ResidentAssessment,
  actionItems: ActionItem[],
  questions: FamilyQuestion[],
): AgendaItem[] {
  const items: AgendaItem[] = []

  const ordered = SENSOR_DOMAIN_IDS.filter((id) => assessment.sensor[id])
  for (const level of ['alert', 'watch'] as const) {
    for (const id of ordered) {
      const da = assessment.sensor[id]!
      if (da.status.status !== level) continue
      items.push({
        id: `agenda-domain-${id}`,
        kind: 'domain',
        title: `${DOMAINS[id].label} — ${STATUS_LABEL[da.status.status]}`,
        detail: da.status.reason,
        domainId: id,
      })
    }
  }

  for (const item of actionItems.filter(isOverdue)) {
    items.push({
      id: `agenda-commitment-${item.id}`,
      kind: 'commitment',
      title: `Overdue: ${item.description}`,
      detail: `${item.owner.name} · ${item.owner.role}`,
    })
  }

  for (const q of questions.filter((x) => !x.answer)) {
    items.push({
      id: `agenda-question-${q.id}`,
      kind: 'question',
      title: 'Family question',
      detail: q.question,
    })
  }

  return items
}
