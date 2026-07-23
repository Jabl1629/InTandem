import type {
  ActionItem,
  Conference,
  FamilyQuestion,
  Goal,
  ManualDomainState,
  NotificationLogEntry,
  Reading,
  Resident,
  StaffMember,
} from '@/types'
import { generateReadings } from './generate'
import { PLANS, RESIDENTS, STAFF_LIST } from './residents'
import {
  ACTION_ITEMS,
  CONFERENCES,
  FAMILY_QUESTIONS,
  GOALS,
  HYDRATION_GOALS,
  MANUAL_STATES,
  NOTIFICATIONS,
} from './content'

export interface SeedData {
  residents: Resident[]
  staff: StaffMember[]
  readings: Reading[]
  manualStates: ManualDomainState[]
  goals: Goal[]
  actionItems: ActionItem[]
  conferences: Conference[]
  notifications: NotificationLogEntry[]
  familyQuestions: FamilyQuestion[]
  hydrationGoals: Record<string, number>
}

/** Assemble the full seeded dataset. Deterministic — same output every load. */
export function buildSeed(): SeedData {
  const readings: Reading[] = RESIDENTS.flatMap((r) => generateReadings(r.id, PLANS[r.id]))
  return {
    residents: RESIDENTS,
    staff: STAFF_LIST,
    readings,
    manualStates: MANUAL_STATES,
    goals: GOALS,
    actionItems: ACTION_ITEMS,
    conferences: CONFERENCES,
    notifications: NOTIFICATIONS,
    familyQuestions: FAMILY_QUESTIONS,
    hydrationGoals: HYDRATION_GOALS,
  }
}

export const SEED = buildSeed()
