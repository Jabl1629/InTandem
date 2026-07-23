import type {
  ActionItem,
  Conference,
  FamilyQuestion,
  Goal,
  ManualDomainState,
  NotificationLogEntry,
  Resident,
} from '@/types'
import { SEED } from '@/data/seed'
import { assessResident, type ResidentAssessment } from '@/domain/assess'
import { MANUAL_DOMAIN_IDS } from '@/data/domains'

// Static seed data never mutates — read straight from SEED.
export const residents = SEED.residents
export const staff = SEED.staff

export function getResident(id: string): Resident | undefined {
  return SEED.residents.find((r) => r.id === id)
}

/** Assess one resident given the current (possibly mutated) action items. */
export function assessmentFor(residentId: string, actionItems: ActionItem[]): ResidentAssessment | null {
  const resident = getResident(residentId)
  if (!resident) return null
  return assessResident({
    resident,
    readings: SEED.readings,
    manualStates: SEED.manualStates,
    actionItems,
    hydrationGoal: SEED.hydrationGoals[residentId] ?? 1500,
  })
}

/** Assess everyone (Rounding Board). Cheap enough to run per-render, but memoize
 * in components on `actionItems`. */
export function assessAll(actionItems: ActionItem[]): Record<string, ResidentAssessment> {
  const out: Record<string, ResidentAssessment> = {}
  for (const r of SEED.residents) {
    const a = assessmentFor(r.id, actionItems)
    if (a) out[r.id] = a
  }
  return out
}

export function goalsFor(residentId: string): Goal[] {
  return SEED.goals.filter((g) => g.residentId === residentId)
}

export function manualStatesFor(residentId: string): ManualDomainState[] {
  const list = SEED.manualStates.filter((m) => m.residentId === residentId)
  // Keep display order aligned with the domain catalog.
  return MANUAL_DOMAIN_IDS.map((id) => list.find((m) => m.domainId === id)).filter(
    (m): m is ManualDomainState => !!m,
  )
}

export function actionItemsFor(residentId: string, all: ActionItem[]): ActionItem[] {
  return all.filter((a) => a.residentId === residentId)
}

export function conferencesFor(residentId: string, all: Conference[]): Conference[] {
  return all
    .filter((c) => c.residentId === residentId)
    .sort((a, b) => (a.date < b.date ? 1 : -1)) // newest first
}

export function notificationsFor(residentId: string, all: NotificationLogEntry[]): NotificationLogEntry[] {
  return all
    .filter((n) => n.residentId === residentId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function questionsFor(residentId: string, questions: FamilyQuestion[]): FamilyQuestion[] {
  return questions.filter((q) => q.residentId === residentId)
}
