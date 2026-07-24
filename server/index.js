/**
 * InTandem EMR demo backend.
 *
 * Fires an ElevenLabs Conversational-AI outbound call, polls the conversation
 * for status + transcript + extracted fields, and fans everything out to the
 * /emr and /console windows over Server-Sent Events (outbound-HTTPS only, so it
 * works from locked-down facility WiFi — no inbound tunnel needed).
 *
 * Endpoints:
 *   GET  /api/health           → { ok, mode }         (used to warm the dyno)
 *   GET  /api/events           → SSE stream of events
 *   POST /api/calls            → fire a call
 *   POST /api/reset            → clear state, broadcast reset
 *
 * If ELEVENLABS_API_KEY is unset (or MOCK=1), the server runs in MOCK mode and
 * replays the client-supplied simulation transcript — lets you exercise the
 * whole pipeline with no key and no real phone call.
 */
import express from 'express'
import cors from 'cors'

const {
  ELEVENLABS_API_KEY,
  ELEVENLABS_AGENT_ID,
  ELEVENLABS_PHONE_NUMBER_ID,
  DEFAULT_TARGET_PHONE,
  ALLOWED_ORIGINS = '*',
  PORT = 3001,
  MOCK,
} = process.env

const LIVE = !!ELEVENLABS_API_KEY && MOCK !== '1'
const EL = 'https://api.elevenlabs.io/v1/convai'

const app = express()
app.use(express.json({ limit: '256kb' }))
app.use(
  cors({
    origin: ALLOWED_ORIGINS === '*' ? true : ALLOWED_ORIGINS.split(',').map((s) => s.trim()),
  }),
)

// ── SSE fan-out ────────────────────────────────────────────────────────────
const clients = new Set()

function broadcast(event) {
  const payload = JSON.stringify({ ...event, ts: Date.now() })
  for (const res of clients) res.write(`data: ${payload}\n\n`)
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: LIVE ? 'live' : 'mock' }))

app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()
  res.write('retry: 3000\n\n')
  res.write(`data: ${JSON.stringify({ type: 'connected', mode: LIVE ? 'live' : 'mock', ts: Date.now() })}\n\n`)
  clients.add(res)
  const keepAlive = setInterval(() => res.write(': ka\n\n'), 15000)
  req.on('close', () => {
    clearInterval(keepAlive)
    clients.delete(res)
  })
})

// ── Fire a call ────────────────────────────────────────────────────────────
app.post('/api/calls', async (req, res) => {
  const { scenarioId, toNumber, dynamicVariables = {}, sim } = req.body || {}
  const to = toNumber || DEFAULT_TARGET_PHONE

  broadcast({ type: 'call_queued', scenarioId })

  // Simulation mode places no real call, so a phone number isn't required.
  if (!LIVE) {
    mockCall({ scenarioId, sim })
    return res.json({ conversationId: `mock-${Date.now()}`, mode: 'mock' })
  }

  if (!to) {
    broadcast({ type: 'call_failed', scenarioId, reason: 'No target phone number provided.' })
    return res.status(400).json({ error: 'No target phone number provided.' })
  }

  try {
    const r = await fetch(`${EL}/twilio/outbound-call`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: ELEVENLABS_AGENT_ID,
        agent_phone_number_id: ELEVENLABS_PHONE_NUMBER_ID,
        to_number: to,
        conversation_initiation_client_data: { dynamic_variables: dynamicVariables },
      }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok || !data.conversation_id) {
      const reason = data?.message || data?.detail || `HTTP ${r.status}`
      broadcast({ type: 'call_failed', scenarioId, reason })
      return res.status(502).json({ error: 'ElevenLabs call failed', reason, detail: data })
    }
    broadcast({ type: 'call_started', scenarioId, conversationId: data.conversation_id })
    pollConversation(data.conversation_id, scenarioId)
    res.json({ conversationId: data.conversation_id, mode: 'live' })
  } catch (e) {
    broadcast({ type: 'call_failed', scenarioId, reason: String(e) })
    res.status(500).json({ error: String(e) })
  }
})

// ── Poll a live conversation for transcript + status + extraction ───────────
async function pollConversation(conversationId, scenarioId) {
  let sent = 0
  const startedAt = Date.now()
  const timer = setInterval(async () => {
    if (Date.now() - startedAt > 8 * 60 * 1000) return clearInterval(timer) // safety cap
    try {
      const r = await fetch(`${EL}/conversations/${conversationId}`, {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      })
      if (!r.ok) return
      const c = await r.json()
      const turns = Array.isArray(c.transcript) ? c.transcript : []
      for (let i = sent; i < turns.length; i++) {
        const t = turns[i]
        if (t && t.message) {
          broadcast({
            type: 'transcript_turn',
            speaker: t.role === 'agent' ? 'assistant' : 'contact',
            text: t.message,
          })
        }
      }
      sent = turns.length
      if (c.status === 'done' || c.status === 'failed') {
        clearInterval(timer)
        broadcast({
          type: 'call_completed',
          scenarioId,
          extraction: mapExtraction(c.analysis),
        })
      }
    } catch {
      /* transient — keep polling */
    }
  }, 2000)
}

// Map ElevenLabs analysis.data_collection_results → our progress-note fields.
// Field IDs must match the data-collection items configured in the agent dashboard.
function mapExtraction(analysis) {
  const dc = (analysis && analysis.data_collection_results) || {}
  const val = (k) => (dc[k] && dc[k].value !== undefined ? dc[k].value : undefined)
  const bool = (v) => v === true || v === 'true' || v === 'yes' || v === 'Yes'
  return {
    contact_identity_confirmed: bool(val('contact_identity_confirmed')),
    call_outcome: val('call_outcome') ?? (analysis?.call_successful ?? 'completed'),
    acknowledgment_received: bool(val('acknowledgment_received')),
    nurse_callback_requested: bool(val('nurse_callback_requested')),
    callback_topic: val('callback_topic'),
    summary_for_chart: val('summary_for_chart') ?? analysis?.transcript_summary ?? '',
  }
}

// ── MOCK: replay the client-supplied simulation transcript over SSE ─────────
function mockCall({ scenarioId, sim }) {
  const turns = (sim && sim.transcript) || []
  broadcast({ type: 'call_started', scenarioId, conversationId: `mock-${Date.now()}` })
  turns.forEach((t, i) =>
    setTimeout(() => broadcast({ type: 'transcript_turn', speaker: t.speaker, text: t.text }), 900 + i * 1200),
  )
  setTimeout(
    () => broadcast({ type: 'call_completed', scenarioId, extraction: sim && sim.extraction }),
    900 + turns.length * 1200 + 700,
  )
}

app.post('/api/reset', (_req, res) => {
  broadcast({ type: 'reset' })
  res.json({ ok: true })
})

app.listen(PORT, () => console.log(`InTandem EMR backend listening on :${PORT} — mode=${LIVE ? 'live' : 'mock'}`))
