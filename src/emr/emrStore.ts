import { create } from 'zustand'
import type { Extraction, TranscriptTurn } from './constants'
import { SCENARIOS } from './constants'

export type CallStatus = 'idle' | 'queued' | 'ringing' | 'in_progress' | 'completed'

export interface PostedNote {
  id: string
  scenarioId: string
  title: string
  postedAt: number // ms
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
  fireScenario: (id: string) => void
  dismissToast: () => void
  resetDemo: () => void
}

// Compressed timings for the client-side simulation (real calls run 1–4 min).
const QUEUE_MS = 1100
const RING_MS = 1900
const TURN_MS = 1300

let timers: ReturnType<typeof setTimeout>[] = []
function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}
function later(fn: () => void, ms: number) {
  timers.push(setTimeout(fn, ms))
}

export const useEmr = create<EmrState>((set, get) => ({
  activeScenarioId: null,
  status: 'idle',
  transcript: [],
  notes: [],
  commitmentOpen: false,
  toast: null,
  seq: 1,

  fireScenario: (id) => {
    const scenario = SCENARIOS[id]
    if (!scenario) return
    clearTimers()

    // The toast fires first — the causality (chart action → phone rings) is the
    // whole point; never let the call precede the toast.
    set({
      toast: `Family notification queued — Susan Hollis (daughter)`,
      activeScenarioId: id,
      status: 'queued',
      transcript: [],
    })
    later(() => set({ toast: null }), 4200)

    later(() => set({ status: 'ringing' }), QUEUE_MS)
    later(() => set({ status: 'in_progress' }), RING_MS)

    // Stream transcript turns.
    scenario.simTranscript.forEach((turn, i) => {
      later(() => {
        set((s) => ({ transcript: [...s.transcript, turn] }))
      }, RING_MS + 400 + i * TURN_MS)
    })

    // Complete → post the note, handle the commitment.
    const doneAt = RING_MS + 400 + scenario.simTranscript.length * TURN_MS + 600
    later(() => {
      const note: PostedNote = {
        id: `note-${get().seq}`,
        scenarioId: id,
        title: scenario.noteTitle,
        postedAt: Date.now(),
        extraction: scenario.simExtraction,
        transcript: scenario.simTranscript,
      }
      set((s) => ({
        status: 'completed',
        notes: [note, ...s.notes],
        seq: s.seq + 1,
        commitmentOpen: id === 'S3a' ? true : id === 'S3b' ? false : s.commitmentOpen,
      }))
    }, doneAt)
  },

  dismissToast: () => set({ toast: null }),

  resetDemo: () => {
    clearTimers()
    set({ activeScenarioId: null, status: 'idle', transcript: [], notes: [], commitmentOpen: false, toast: null })
  },
}))
