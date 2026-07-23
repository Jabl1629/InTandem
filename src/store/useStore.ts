import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActionItem,
  Conference,
  Decision,
  FamilyQuestion,
  FamilySummary,
  NotificationChannel,
  NotificationLogEntry,
  StaffMember,
} from '@/types'
import { TODAY_ISO } from '@/lib/dates'
import { SEED } from '@/data/seed'

/** A live conference session (spec §4.3). Persisted so a mid-demo refresh survives. */
export interface LiveSession {
  residentId: string
  conferenceId: string
  startedAtMs: number
  checkedAgendaIds: string[]
}

interface Mutable {
  actionItems: ActionItem[]
  conferences: Conference[]
  notifications: NotificationLogEntry[]
  familyQuestions: FamilyQuestion[]
  familySummaries: FamilySummary[]
  live: LiveSession | null
  seq: number
}

interface Actions {
  nextId: (prefix: string) => string
  addActionItem: (item: Omit<ActionItem, 'id' | 'capturedLive'>) => ActionItem
  toggleActionItem: (id: string) => void
  addDecision: (conferenceId: string, text: string, by?: string) => void
  addNotification: (residentId: string, event: string, channel: NotificationChannel, loggedBy: string) => void
  submitFamilyQuestion: (residentId: string, question: string, askedBy: string) => void
  answerFamilyQuestion: (id: string, answer: string) => void
  startConference: (residentId: string) => string
  toggleAgendaItem: (agendaId: string) => void
  endConference: (summary: Omit<FamilySummary, 'id' | 'date'>) => FamilySummary
  resetDemo: () => void
}

export type StoreState = Mutable & Actions

const initialMutable = (): Mutable => ({
  actionItems: SEED.actionItems.map((a) => ({ ...a })),
  conferences: SEED.conferences.map((c) => ({ ...c })),
  notifications: SEED.notifications.map((n) => ({ ...n })),
  familyQuestions: SEED.familyQuestions.map((q) => ({ ...q })),
  familySummaries: [],
  live: null,
  seq: 1,
})

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialMutable(),

      nextId: (prefix) => {
        const seq = get().seq
        set({ seq: seq + 1 })
        return `${prefix}-live-${seq}`
      },

      addActionItem: (item) => {
        const created: ActionItem = { ...item, id: get().nextId('ai'), capturedLive: true }
        set((s) => ({ actionItems: [...s.actionItems, created] }))
        return created
      },

      toggleActionItem: (id) =>
        set((s) => ({
          actionItems: s.actionItems.map((a) =>
            a.id === id ? { ...a, status: a.status === 'done' ? 'open' : 'done' } : a,
          ),
        })),

      addDecision: (conferenceId, text, by) => {
        const decision: Decision = { id: get().nextId('d'), date: TODAY_ISO, text, by }
        set((s) => ({
          conferences: s.conferences.map((c) =>
            c.id === conferenceId ? { ...c, decisions: [...c.decisions, decision] } : c,
          ),
        }))
      },

      addNotification: (residentId, event, channel, loggedBy) => {
        const entry: NotificationLogEntry = {
          id: get().nextId('n'),
          residentId,
          date: TODAY_ISO,
          event,
          channel,
          loggedBy,
        }
        set((s) => ({ notifications: [entry, ...s.notifications] }))
      },

      submitFamilyQuestion: (residentId, question, askedBy) => {
        const q: FamilyQuestion = {
          id: get().nextId(`fq-${residentId}`),
          residentId,
          question,
          askedBy,
          askedDate: TODAY_ISO,
        }
        set((s) => ({ familyQuestions: [...s.familyQuestions, q] }))
      },

      answerFamilyQuestion: (id, answer) =>
        set((s) => ({
          familyQuestions: s.familyQuestions.map((q) => (q.id === id ? { ...q, answer } : q)),
        })),

      startConference: (residentId) => {
        const conferenceId = get().nextId(`conf-${residentId}`)
        const conference: Conference = {
          id: conferenceId,
          residentId,
          date: TODAY_ISO,
          type: 'significant-change',
          decisions: [],
          actionItemIds: [],
          familyQuestions: [],
          summaryGenerated: false,
        }
        set((s) => ({
          conferences: [...s.conferences, conference],
          live: { residentId, conferenceId, startedAtMs: Date.now(), checkedAgendaIds: [] },
        }))
        return conferenceId
      },

      toggleAgendaItem: (agendaId) =>
        set((s) => {
          if (!s.live) return {}
          const has = s.live.checkedAgendaIds.includes(agendaId)
          return {
            live: {
              ...s.live,
              checkedAgendaIds: has
                ? s.live.checkedAgendaIds.filter((x) => x !== agendaId)
                : [...s.live.checkedAgendaIds, agendaId],
            },
          }
        }),

      endConference: (summaryInput) => {
        const summary: FamilySummary = { ...summaryInput, id: get().nextId('summary'), date: TODAY_ISO }
        set((s) => ({
          familySummaries: [summary, ...s.familySummaries],
          conferences: s.conferences.map((c) =>
            c.id === summary.conferenceId ? { ...c, summaryGenerated: true } : c,
          ),
          live: null,
        }))
        return summary
      },

      resetDemo: () => {
        set({ ...initialMutable() })
      },
    }),
    {
      name: 'intandem-demo-v1',
      partialize: (s): Mutable => ({
        actionItems: s.actionItems,
        conferences: s.conferences,
        notifications: s.notifications,
        familyQuestions: s.familyQuestions,
        familySummaries: s.familySummaries,
        live: s.live,
        seq: s.seq,
      }),
    },
  ),
)

/** Static seed accessors — these never change, so read them straight from SEED. */
export const staffList: StaffMember[] = SEED.staff
