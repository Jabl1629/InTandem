import { create } from 'zustand'
import type { Extraction, TranscriptTurn } from './constants'
import { SCENARIOS } from './constants'
import {
  backendConfigured,
  buildDynamicVariables,
  getBackendUrl,
  postCall,
  postReset,
  type BackendEvent,
} from './backend'

export type CallStatus = 'idle' | 'queued' | 'ringing' | 'in_progress' | 'completed'

export interface PostedNote {
  id: string
  scenarioId: string
  title: string
  postedAt: number
  extraction: Extraction
  transcript: TranscriptTurn[]
}

interface EmrState {
  activeScenarioId: string | null
  status: CallStatus
  transcript: TranscriptTurn[]
  notes: PostedNote[]
  commitmentOpen: boolean
  toast: string | null
  seq: number
  // console-configurable
  targetPhone: string
  contactFirst: string

  fireScenario: (id: string) => void
  handleEvent: (e: BackendEvent) => void
  setTargetPhone: (v: string) => void
  setContactFirst: (v: string) => void
  dismissToast: () => void
  resetDemo: () => void
}

const QUEUE_MS = 1100
const RING_MS = 1900
const TURN_MS = 1300
const TOAST_MS = 4200

let timers: ReturnType<typeof setTimeout>[] = []
const clearTimers = () => {
  timers.forEach(clearTimeout)
  timers = []
}
const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms))

const QUEUE_TOAST = 'Family notification queued — Susan Hollis (daughter)'

export const useEmr = create<EmrState>((set, get) => {
  // ── shared transitions (used by both the SSE path and the simulation) ──
  const started = () => set((s) => (s.status === 'queued' || s.status === 'idle' ? { status: 'ringing' } : {}))
  const addTurn = (turn: TranscriptTurn) =>
    set((s) => ({ status: 'in_progress', transcript: [...s.transcript, turn] }))
  const completed = (scenarioId: string | undefined, extraction?: Extraction) => {
    const sid = scenarioId ?? get().activeScenarioId ?? ''
    const scenario = SCENARIOS[sid]
    const ex = extraction ?? scenario?.simExtraction
    set((s) => {
      const note: PostedNote | null =
        scenario && ex
          ? {
              id: `note-${s.seq}`,
              scenarioId: sid,
              title: scenario.noteTitle,
              postedAt: Date.now(),
              extraction: ex,
              transcript: s.transcript.length ? s.transcript : scenario.simTranscript,
            }
          : null
      return {
        status: 'completed',
        notes: note ? [note, ...s.notes] : s.notes,
        seq: s.seq + 1,
        commitmentOpen: sid === 'S3a' ? true : sid === 'S3b' ? false : s.commitmentOpen,
      }
    })
  }

  const scheduleToastDismiss = () => later(() => set({ toast: null }), TOAST_MS)

  const runSimulation = (id: string) => {
    const scenario = SCENARIOS[id]
    later(started, QUEUE_MS)
    later(() => set({ status: 'in_progress' }), RING_MS)
    scenario.simTranscript.forEach((turn, i) => later(() => addTurn(turn), RING_MS + 400 + i * TURN_MS))
    later(() => completed(id, scenario.simExtraction), RING_MS + 400 + scenario.simTranscript.length * TURN_MS + 600)
  }

  return {
    activeScenarioId: null,
    status: 'idle',
    transcript: [],
    notes: [],
    commitmentOpen: false,
    toast: null,
    seq: 1,
    targetPhone: '',
    contactFirst: '',

    fireScenario: (id) => {
      const scenario = SCENARIOS[id]
      if (!scenario) return
      clearTimers()
      // Toast first — the causality (chart action → phone rings) is the whole point.
      set({ toast: QUEUE_TOAST, activeScenarioId: id, status: 'queued', transcript: [] })
      scheduleToastDismiss()

      if (backendConfigured()) {
        postCall(getBackendUrl(), {
          scenarioId: id,
          toNumber: get().targetPhone || undefined,
          dynamicVariables: buildDynamicVariables(scenario, get().contactFirst),
          sim: { transcript: scenario.simTranscript, extraction: scenario.simExtraction },
        }).catch((e) => set({ status: 'idle', toast: `Call failed: ${e.message ?? e}` }))
        // status/transcript/note are driven by SSE (handleEvent)
      } else {
        runSimulation(id)
      }
    },

    // SSE events from the backend (real calls, and cross-window sync).
    handleEvent: (e) => {
      switch (e.type) {
        case 'call_queued':
          clearTimers()
          set({ activeScenarioId: e.scenarioId ?? null, status: 'queued', transcript: [], toast: QUEUE_TOAST })
          scheduleToastDismiss()
          break
        case 'call_started':
          if (e.scenarioId) set({ activeScenarioId: e.scenarioId })
          started()
          break
        case 'transcript_turn':
          if (e.speaker && e.text) addTurn({ speaker: e.speaker, text: e.text })
          break
        case 'call_completed':
          completed(e.scenarioId, e.extraction)
          break
        case 'call_failed':
          set({ status: 'idle', toast: `Call failed: ${e.reason ?? 'unknown'}` })
          scheduleToastDismiss()
          break
        case 'reset':
          clearTimers()
          set({ activeScenarioId: null, status: 'idle', transcript: [], notes: [], commitmentOpen: false, toast: null })
          break
      }
    },

    setTargetPhone: (v) => set({ targetPhone: v }),
    setContactFirst: (v) => set({ contactFirst: v }),
    dismissToast: () => set({ toast: null }),

    resetDemo: () => {
      clearTimers()
      if (backendConfigured()) postReset(getBackendUrl())
      set({ activeScenarioId: null, status: 'idle', transcript: [], notes: [], commitmentOpen: false, toast: null })
    },
  }
})
