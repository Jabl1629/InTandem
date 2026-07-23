/**
 * InTandem by GoSteady — data model (spec §5).
 * Faithful to the spec's interfaces, with a few practical additions
 * (domain metadata, goal direction) needed to render and compute.
 */

export type CareLevel = 'IL' | 'AL' | 'MC' | 'SNF'
export type Provenance = 'sensor' | 'staff' | 'family'
export type DomainStatus = 'stable' | 'watch' | 'alert'
export type StaffRole = 'DON' | 'RN' | 'PT' | 'Dining' | 'Activities' | 'SocialWork' | 'ED'

export type DomainId =
  | 'mobility_activity'
  | 'mobility_gait'
  | 'hydration'
  | 'weight'
  | 'nutrition'
  | 'wellness'
  | 'falls'
  | 'medications'
  | 'sleep'
  | 'pain'
  | 'adl'
  | 'social'
  | 'skin'

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
}

export interface Resident {
  id: string
  name: string
  photoUrl: string
  age: number
  room: string
  careLevel: CareLevel
  admitDate: string // ISO
  primaryContact: { name: string; relationship: string; phone: string }
  lastConferenceDate: string // ISO — the reference line for every delta band
  nextConferenceDate: string // ISO
  significantChangeFlag: boolean
  /** authored demo narrative tag, purely for seeding/notes */
  arc?: 'decline' | 'rehab' | 'data-gap' | 'stable'
}

export interface Reading {
  residentId: string
  domainId: DomainId
  date: string // ISO (yyyy-mm-dd)
  value: number
  provenance: Provenance
}

/** "Higher is better" vs "lower is better" drives delta arrow polarity. */
export type Direction = 'up-good' | 'down-good' | 'neutral'

export interface Domain {
  id: DomainId
  label: string
  shortLabel: string
  unit: string
  provenance: Provenance
  sensorBacked: boolean // full trend card vs. compact clinical checklist strip
  direction: Direction
  /** number of decimals to render */
  precision: number
  /** which sensor source, for the card subtitle */
  source: string
  group: 'mobility' | 'nutrition-hydration' | 'body' | 'wellness' | 'clinical'
}

export interface Goal {
  id: string
  residentId: string
  domainId: DomainId
  plainLanguage: string
  targetMetric: string
  targetValue: number
  /** current value used for the live progress bar (fed from Zone A) */
  currentValue: number
  /** progress is a 0..1 fraction; when omitted it is derived from current/target */
  progressOverride?: number
  interventions: string[]
  owner: StaffMember
  familyVisible: true
}

export type ActionItemStatus = 'open' | 'done' | 'overdue'

export interface ActionItem {
  id: string
  residentId: string
  description: string
  owner: StaffMember
  dueDate: string // ISO
  status: ActionItemStatus
  createdInConferenceId?: string
  /** true when captured live during this demo session (for subtle "new" styling) */
  capturedLive?: boolean
}

export interface Decision {
  id: string
  date: string // ISO
  text: string
  by?: string
}

export interface FamilyQuestion {
  id: string
  residentId?: string // present on flat "pending questions" list; omitted when embedded in a Conference
  question: string
  askedBy: string
  answer?: string
  askedDate: string // ISO
}

export type ConferenceType = 'routine' | 'significant-change' | 'admission'

export interface Conference {
  id: string
  residentId: string
  date: string // ISO
  type: ConferenceType
  decisions: Decision[]
  actionItemIds: string[]
  familyQuestions: FamilyQuestion[]
  summaryGenerated: boolean
}

export type NotificationChannel = 'phone' | 'portal' | 'in-person'

export interface NotificationLogEntry {
  id: string
  residentId: string
  date: string // ISO
  event: string
  channel: NotificationChannel
  loggedBy: string
}

/**
 * Manual clinical-strip domains aren't time-series; they carry a current
 * value, a trend arrow, and — critically for the provenance/freshness story
 * (Marguerite) — a last-updated date.
 */
export interface ManualDomainState {
  residentId: string
  domainId: DomainId
  displayValue: string
  detail?: string // secondary line: diet flags, last incident, med changes
  trend: 'up' | 'down' | 'flat' | 'none'
  status: DomainStatus
  lastUpdatedISO: string
  lastEventISO?: string // e.g., last fall date (feeds the significant-change trigger)
}

/** A generated family summary, produced when a conference ends. */
export interface FamilySummary {
  id: string
  residentId: string
  conferenceId: string
  date: string // ISO
  reviewed: string[]
  changed: string[]
  decisions: string[]
  actionItems: { description: string; owner: string; dueDate: string }[]
  questionsAnswered: { question: string; answer: string }[]
  nextConferenceDate: string
}
