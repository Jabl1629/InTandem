import { CONTACT, FACILITY, RESIDENT, type Scenario } from './constants'

const LS_KEY = 'intandem_backend_url'

/** Backend base URL — runtime override (localStorage, set from the console)
 * wins over the build-time VITE_BACKEND_URL; empty = simulation mode. */
export function getBackendUrl(): string {
  try {
    const rt = localStorage.getItem(LS_KEY)
    const bt = import.meta.env.VITE_BACKEND_URL as string | undefined
    return (rt || bt || '').trim().replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function setBackendUrl(url: string) {
  try {
    const clean = url.trim().replace(/\/+$/, '')
    if (clean) localStorage.setItem(LS_KEY, clean)
    else localStorage.removeItem(LS_KEY)
  } catch {
    /* ignore */
  }
}

export function backendConfigured(): boolean {
  return !!getBackendUrl()
}

/** Dynamic variables passed to the ElevenLabs agent per call (handoff §3). */
export function buildDynamicVariables(scenario: Scenario, contactFirst?: string): Record<string, string> {
  const name = (contactFirst || '').trim() || CONTACT.first
  return {
    first_message: scenario.firstMessage.split(CONTACT.first).join(name),
    call_type: scenario.callType,
    scenario_facts: scenario.facts,
    facility_name: FACILITY.name,
    facility_callback_number: FACILITY.callbackNumber,
    resident_first_name: RESIDENT.first,
    resident_full_name: RESIDENT.full,
    resident_room: RESIDENT.room,
    contact_first_name: name,
    contact_full_name: CONTACT.full,
    contact_relation: CONTACT.relation,
  }
}

export interface FireBody {
  scenarioId: string
  toNumber?: string
  dynamicVariables: Record<string, string>
  sim?: { transcript: Scenario['simTranscript']; extraction: Scenario['simExtraction'] }
}

export async function postCall(base: string, body: FireBody): Promise<{ conversationId?: string; mode?: string }> {
  const r = await fetch(`${base}/api/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.reason || data?.error || `HTTP ${r.status}`)
  return data
}

export async function checkHealth(base: string): Promise<{ ok: boolean; mode?: string }> {
  try {
    const r = await fetch(`${base}/api/health`, { cache: 'no-store' })
    if (!r.ok) return { ok: false }
    return await r.json()
  } catch {
    return { ok: false }
  }
}

export async function postReset(base: string): Promise<void> {
  try {
    await fetch(`${base}/api/reset`, { method: 'POST' })
  } catch {
    /* ignore */
  }
}

export interface BackendEvent {
  type: 'connected' | 'call_queued' | 'call_started' | 'transcript_turn' | 'call_completed' | 'call_failed' | 'reset'
  scenarioId?: string
  conversationId?: string
  speaker?: 'assistant' | 'contact'
  text?: string
  extraction?: Scenario['simExtraction']
  reason?: string
  mode?: string
}

/** Open the SSE stream. Returns the EventSource so the caller can close it. */
export function connectEvents(base: string, onEvent: (e: BackendEvent) => void): EventSource {
  const es = new EventSource(`${base}/api/events`)
  es.onmessage = (m) => {
    try {
      onEvent(JSON.parse(m.data))
    } catch {
      /* ignore malformed */
    }
  }
  return es
}
