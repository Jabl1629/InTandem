import type {
  ActionItem,
  Conference,
  FamilyQuestion,
  Goal,
  ManualDomainState,
  NotificationLogEntry,
} from '@/types'
import { daysAgoISO, daysFromNowISO } from '@/lib/dates'
import { PLANS, RESIDENTS, STAFF } from './residents'

// ------------------------------------------------------------------
// Manual clinical-strip states
// ------------------------------------------------------------------
type ManualSeed = Omit<ManualDomainState, 'residentId'>

function stableManual(): ManualSeed[] {
  return [
    { domainId: 'falls', displayValue: '0 in 90 days', detail: 'Last incident: none', trend: 'none', status: 'stable', lastUpdatedISO: daysAgoISO(5) },
    { domainId: 'medications', displayValue: '6 active', detail: 'No changes since last conference', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(7) },
    { domainId: 'adl', displayValue: 'Independent', detail: 'No change', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(6) },
    { domainId: 'pain', displayValue: '2 / 10', detail: 'Occasional, well controlled', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(4) },
    { domainId: 'sleep', displayValue: 'Normal', detail: '', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(5) },
    { domainId: 'social', displayValue: '4 / wk', detail: 'Regular attendee', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(8) },
    { domainId: 'skin', displayValue: 'Intact', detail: '', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(6) },
  ]
}

function withResident(rid: string, seeds: ManualSeed[]): ManualDomainState[] {
  return seeds.map((s) => ({ ...s, residentId: rid }))
}

/** Merge overrides (by domainId) onto a base manual set. */
function overrideManual(base: ManualSeed[], overrides: Partial<ManualSeed>[]): ManualSeed[] {
  return base.map((b) => {
    const o = overrides.find((x) => x.domainId === b.domainId)
    return o ? { ...b, ...o } : b
  })
}

const eleanorManual = overrideManual(stableManual(), [
  { domainId: 'falls', displayValue: '1 in 90 days', detail: 'Last incident: 22 days ago — minor, no injury', trend: 'up', status: 'watch', lastUpdatedISO: daysAgoISO(22), lastEventISO: daysAgoISO(22) },
  { domainId: 'medications', displayValue: '8 active', detail: 'Sertraline started 3 wks ago; Lasix dose increased', trend: 'up', status: 'watch', lastUpdatedISO: daysAgoISO(10) },
  { domainId: 'adl', displayValue: 'Needs help dressing', detail: 'New since last conference — was independent', trend: 'down', status: 'watch', lastUpdatedISO: daysAgoISO(9) },
  { domainId: 'pain', displayValue: '5 / 10', detail: 'Right hip, worsening', trend: 'up', status: 'watch', lastUpdatedISO: daysAgoISO(6) },
  { domainId: 'sleep', displayValue: 'Disrupted', detail: 'Waking 3–4× per night', trend: 'down', status: 'watch', lastUpdatedISO: daysAgoISO(6) },
  { domainId: 'social', displayValue: '1 / wk', detail: 'Withdrawing from activities', trend: 'down', status: 'watch', lastUpdatedISO: daysAgoISO(7) },
])

// Marguerite: sensors are fine; the manual domains are STALE — that's the story.
const margueriteManual = overrideManual(stableManual(), [
  { domainId: 'falls', displayValue: '0 in 90 days', detail: 'Last reviewed 33 days ago', trend: 'none', status: 'stable', lastUpdatedISO: daysAgoISO(33) },
  { domainId: 'medications', displayValue: '5 active', detail: 'Last reconciled 38 days ago', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(38) },
  { domainId: 'adl', displayValue: 'Needs assistance', detail: 'Last updated 41 days ago', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(41) },
  { domainId: 'pain', displayValue: '3 / 10', detail: 'Reported by daughter — last updated 41 days ago', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(41) },
  { domainId: 'sleep', displayValue: 'Normal', detail: 'Last updated 36 days ago', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(36) },
  { domainId: 'skin', displayValue: 'Intact', detail: 'Last updated 30 days ago', trend: 'flat', status: 'stable', lastUpdatedISO: daysAgoISO(30) },
])

const frankManual = overrideManual(stableManual(), [
  { domainId: 'adl', displayValue: 'Minimal assist', detail: 'Improving — was moderate assist', trend: 'up', status: 'stable', lastUpdatedISO: daysAgoISO(4) },
  { domainId: 'medications', displayValue: '4 active', detail: 'Pain meds tapering', trend: 'down', status: 'stable', lastUpdatedISO: daysAgoISO(6) },
  { domainId: 'social', displayValue: '5 / wk', detail: 'Very engaged', trend: 'up', status: 'stable', lastUpdatedISO: daysAgoISO(3) },
])

export const MANUAL_STATES: ManualDomainState[] = [
  ...withResident('eleanor', eleanorManual),
  ...withResident('frank', frankManual),
  ...withResident('marguerite', margueriteManual),
  ...RESIDENTS.filter((r) => !['eleanor', 'frank', 'marguerite'].includes(r.id)).flatMap((r) =>
    withResident(r.id, stableManual()),
  ),
]

// ------------------------------------------------------------------
// Goals (Zone B — the plan)
// ------------------------------------------------------------------
export const GOALS: Goal[] = [
  {
    id: 'g-eleanor-1', residentId: 'eleanor', domainId: 'mobility_activity',
    plainLanguage: 'Walk to the dining room without assistance', targetMetric: '400 m walked per day',
    targetValue: 400, currentValue: 205,
    interventions: ['Twice-weekly PT sessions', 'Walker at every meal', 'Escort encouragement'],
    owner: STAFF.pt, familyVisible: true,
  },
  {
    id: 'g-eleanor-2', residentId: 'eleanor', domainId: 'weight',
    plainLanguage: 'Stop the unintended weight loss', targetMetric: 'Maintain at or above 145 lb',
    targetValue: 145, currentValue: 140.6,
    interventions: ['Fortified meals & snacks', 'Weekly weigh-ins', 'Dietitian consult'],
    owner: STAFF.dining, familyVisible: true,
  },
  {
    id: 'g-eleanor-3', residentId: 'eleanor', domainId: 'hydration',
    plainLanguage: 'Stay hydrated through the day', targetMetric: 'At least 1500 mL per day',
    targetValue: 1500, currentValue: 1180,
    interventions: ['Offer water at each check-in', 'Preferred-drink list at nurse station'],
    owner: STAFF.rn, familyVisible: true,
  },
  {
    id: 'g-frank-1', residentId: 'frank', domainId: 'mobility_activity',
    plainLanguage: 'Walk to the dining room without assistance by September', targetMetric: '400 m walked per day',
    targetValue: 400, currentValue: 418,
    interventions: ['Continue home exercise program', 'Progressive walking distance'],
    owner: STAFF.pt, familyVisible: true,
  },
  {
    id: 'g-frank-2', residentId: 'frank', domainId: 'mobility_gait',
    plainLanguage: 'Return to an independent walking pace', targetMetric: 'Gait speed ≥ 0.90 m/s',
    targetValue: 0.9, currentValue: 0.95,
    interventions: ['PT gait training', 'Balance work'],
    owner: STAFF.pt, familyVisible: true,
  },
  {
    id: 'g-marguerite-1', residentId: 'marguerite', domainId: 'social',
    plainLanguage: 'Attend at least three activities each week', targetMetric: '3 activities per week',
    targetValue: 3, currentValue: 3,
    interventions: ['Escort to music therapy', 'Small-group activities'],
    owner: STAFF.activities, familyVisible: true,
  },
  {
    id: 'g-marguerite-2', residentId: 'marguerite', domainId: 'wellness',
    plainLanguage: 'Stay engaged with daily check-ins', targetMetric: 'Daily voice check-in',
    targetValue: 7, currentValue: 6,
    interventions: ['Morning voice check-in', 'Familiar-voice prompts'],
    owner: STAFF.social, familyVisible: true,
  },
]

// One generic goal for each background resident.
for (const r of RESIDENTS) {
  if (['eleanor', 'frank', 'marguerite'].includes(r.id)) continue
  GOALS.push({
    id: `g-${r.id}-1`, residentId: r.id, domainId: 'mobility_activity',
    plainLanguage: 'Stay active every day', targetMetric: 'Daily walking goal',
    targetValue: 400, currentValue: 380,
    interventions: ['Daily walk', 'Group exercise class'],
    owner: STAFF.pt, familyVisible: true,
  })
}

// ------------------------------------------------------------------
// Action items (Zone C — commitments)
// ------------------------------------------------------------------
export const ACTION_ITEMS: ActionItem[] = [
  { id: 'ai-eleanor-1', residentId: 'eleanor', description: 'Schedule PT evaluation for gait decline', owner: STAFF.pt, dueDate: daysAgoISO(6), status: 'overdue', createdInConferenceId: 'conf-eleanor-1' },
  { id: 'ai-eleanor-2', residentId: 'eleanor', description: 'Begin twice-weekly PT sessions', owner: STAFF.pt, dueDate: daysFromNowISO(5), status: 'open' },
  { id: 'ai-eleanor-3', residentId: 'eleanor', description: 'Dietitian consult for weight loss', owner: STAFF.dining, dueDate: daysFromNowISO(3), status: 'open' },
  { id: 'ai-eleanor-4', residentId: 'eleanor', description: 'Notify daughter of new medication', owner: STAFF.rn, dueDate: daysAgoISO(9), status: 'done', createdInConferenceId: 'conf-eleanor-1' },

  { id: 'ai-frank-1', residentId: 'frank', description: 'Continue home exercise program', owner: STAFF.pt, dueDate: daysFromNowISO(10), status: 'open' },
  { id: 'ai-frank-2', residentId: 'frank', description: 'Assess readiness for reduced AL support', owner: STAFF.don, dueDate: daysFromNowISO(14), status: 'open' },
  { id: 'ai-frank-3', residentId: 'frank', description: 'Complete SNF→AL transition paperwork', owner: STAFF.social, dueDate: daysAgoISO(18), status: 'done', createdInConferenceId: 'conf-frank-1' },

  { id: 'ai-marguerite-1', residentId: 'marguerite', description: 'Update pain assessment', owner: STAFF.rn, dueDate: daysAgoISO(4), status: 'overdue' },
  { id: 'ai-marguerite-2', residentId: 'marguerite', description: 'Reconcile medication list', owner: STAFF.rn, dueDate: daysFromNowISO(2), status: 'open' },
]

// Two action items per background resident (one on-track, one done).
for (const r of RESIDENTS) {
  if (['eleanor', 'frank', 'marguerite'].includes(r.id)) continue
  ACTION_ITEMS.push(
    { id: `ai-${r.id}-1`, residentId: r.id, description: 'Continue current care plan', owner: STAFF.rn, dueDate: daysFromNowISO(12), status: 'open' },
    { id: `ai-${r.id}-2`, residentId: r.id, description: 'Send quarterly summary to family', owner: STAFF.don, dueDate: daysAgoISO(10), status: 'done', createdInConferenceId: `conf-${r.id}-1` },
  )
}

// ------------------------------------------------------------------
// Conferences (decision log source)
// ------------------------------------------------------------------
export const CONFERENCES: Conference[] = [
  {
    id: 'conf-eleanor-1', residentId: 'eleanor', date: RESIDENTS.find((r) => r.id === 'eleanor')!.lastConferenceDate, type: 'routine',
    decisions: [
      { id: 'd-e1', date: daysAgoISO(70), text: 'Continue current mobility plan; monitor weight monthly', by: 'Karen Alvarez' },
      { id: 'd-e2', date: daysAgoISO(70), text: 'Trial sertraline for low mood', by: 'Priya Nair' },
    ],
    actionItemIds: ['ai-eleanor-1', 'ai-eleanor-4'], familyQuestions: [], summaryGenerated: true,
  },
  {
    id: 'conf-eleanor-0', residentId: 'eleanor', date: daysAgoISO(160), type: 'routine',
    decisions: [{ id: 'd-e0', date: daysAgoISO(160), text: 'Baseline plan established; independent with walker', by: 'Karen Alvarez' }],
    actionItemIds: [], familyQuestions: [], summaryGenerated: true,
  },
  {
    id: 'conf-frank-1', residentId: 'frank', date: RESIDENTS.find((r) => r.id === 'frank')!.lastConferenceDate, type: 'admission',
    decisions: [
      { id: 'd-f1', date: daysAgoISO(58), text: 'Admitted for post-hip-replacement rehab; aggressive PT plan', by: 'Marcus Webb' },
      { id: 'd-f2', date: daysAgoISO(58), text: 'Target independent ambulation by September', by: 'Karen Alvarez' },
    ],
    actionItemIds: ['ai-frank-3'], familyQuestions: [], summaryGenerated: true,
  },
  {
    id: 'conf-marguerite-1', residentId: 'marguerite', date: RESIDENTS.find((r) => r.id === 'marguerite')!.lastConferenceDate, type: 'routine',
    decisions: [{ id: 'd-m1', date: daysAgoISO(75), text: 'Continue memory-care activities; maintain social engagement', by: 'Dana Kim' }],
    actionItemIds: [], familyQuestions: [], summaryGenerated: true,
  },
]

// One past conference for each background resident.
for (const r of RESIDENTS) {
  if (['eleanor', 'frank', 'marguerite'].includes(r.id)) continue
  CONFERENCES.push({
    id: `conf-${r.id}-1`, residentId: r.id, date: r.lastConferenceDate, type: 'routine',
    decisions: [{ id: `d-${r.id}-1`, date: r.lastConferenceDate, text: 'Care plan reviewed; no significant changes', by: 'Karen Alvarez' }],
    actionItemIds: [`ai-${r.id}-2`], familyQuestions: [], summaryGenerated: true,
  })
}

// ------------------------------------------------------------------
// Notification log (spec §4.3 — answers the #1 ombudsman complaint)
// ------------------------------------------------------------------
// Event strings are phrased as the object of "Family notified of …".
export const NOTIFICATIONS: NotificationLogEntry[] = [
  { id: 'n-eleanor-1', residentId: 'eleanor', date: daysAgoISO(70), event: 'the quarterly care conference summary', channel: 'portal', loggedBy: 'Karen Alvarez' },
  { id: 'n-eleanor-2', residentId: 'eleanor', date: daysAgoISO(10), event: 'a new medication (sertraline)', channel: 'phone', loggedBy: 'Priya Nair' },
  { id: 'n-eleanor-3', residentId: 'eleanor', date: daysAgoISO(4), event: 'the recent weight-loss trend', channel: 'phone', loggedBy: 'Karen Alvarez' },

  { id: 'n-frank-1', residentId: 'frank', date: daysAgoISO(20), event: 'the transfer from skilled nursing to assisted living', channel: 'phone', loggedBy: 'Grace Bello' },
  { id: 'n-frank-2', residentId: 'frank', date: daysAgoISO(12), event: 'this week’s rehab progress', channel: 'portal', loggedBy: 'Marcus Webb' },

  { id: 'n-marguerite-1', residentId: 'marguerite', date: daysAgoISO(75), event: 'the quarterly care summary', channel: 'portal', loggedBy: 'Karen Alvarez' },
]

for (const r of RESIDENTS) {
  if (['eleanor', 'frank', 'marguerite'].includes(r.id)) continue
  NOTIFICATIONS.push(
    { id: `n-${r.id}-1`, residentId: r.id, date: r.lastConferenceDate, event: 'the care conference summary', channel: 'portal', loggedBy: 'Karen Alvarez' },
    { id: `n-${r.id}-2`, residentId: r.id, date: daysAgoISO(14), event: 'a routine status update', channel: 'phone', loggedBy: 'Priya Nair' },
  )
}

// ------------------------------------------------------------------
// Pending family questions (feed the pre-meeting brief; two residents)
// ------------------------------------------------------------------
export const FAMILY_QUESTIONS: FamilyQuestion[] = [
  { id: 'fq-eleanor-1', residentId: 'eleanor', question: 'Is Mom’s weight loss something we should be worried about? Should we be changing her meals?', askedBy: 'Susan (daughter)', askedDate: daysAgoISO(3) },
  { id: 'fq-marguerite-1', residentId: 'marguerite', question: 'When was Mom’s pain last checked? She mentioned some discomfort when we spoke on Sunday.', askedBy: 'David (son)', askedDate: daysAgoISO(2) },
]

/** Map of residentId → hydration goal, for the assessment pass. */
export const HYDRATION_GOALS: Record<string, number> = Object.fromEntries(
  RESIDENTS.map((r) => [r.id, PLANS[r.id]?.hydrationGoal ?? 1500]),
)
