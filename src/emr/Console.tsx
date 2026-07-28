import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT, RESIDENT, SCENARIOS, SCENARIO_ORDER } from './constants'
import { useEmr } from './emrStore'
import { useEmrEvents } from './useEmrEvents'
import { backendConfigured, checkHealth, getBackendUrl, setBackendUrl } from './backend'

const BG = '#0f1319'
const PANEL = '#171c24'
const LINE = '#2a313c'
const INK = '#e5e9f0'
const SUB = '#98a2b3'
const BLUE = '#3f7fc0'

function Panel({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: PANEL, borderColor: LINE }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: SUB }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  )
}

function useHealth() {
  const [h, setH] = useState({ mode: '', ok: false, checking: true })
  // Re-runnable: the free tier sleeps, so a cold start can fail the first
  // check and succeed ~50s later. The status pill calls this.
  const recheck = useCallback(() => {
    if (!backendConfigured()) {
      setH({ mode: 'simulation', ok: true, checking: false })
      return
    }
    setH((p) => ({ ...p, checking: true }))
    checkHealth(getBackendUrl()).then((r) =>
      setH({ mode: r.mode ?? 'unreachable', ok: r.ok, checking: false }),
    )
  }, [])
  useEffect(recheck, [recheck])
  return { ...h, recheck }
}

export function Console() {
  useEmrEvents()
  const status = useEmr((s) => s.status)
  const activeScenarioId = useEmr((s) => s.activeScenarioId)
  const transcript = useEmr((s) => s.transcript)
  const commitmentOpen = useEmr((s) => s.commitmentOpen)
  const targetPhone = useEmr((s) => s.targetPhone)
  const contactFirst = useEmr((s) => s.contactFirst)
  const setTargetPhone = useEmr((s) => s.setTargetPhone)
  const setContactFirst = useEmr((s) => s.setContactFirst)
  const fireScenario = useEmr((s) => s.fireScenario)
  const resetDemo = useEmr((s) => s.resetDemo)

  const health = useHealth()
  const [urlDraft, setUrlDraft] = useState(getBackendUrl())
  const busy = status !== 'idle' && status !== 'completed'

  const saveUrl = () => {
    setBackendUrl(urlDraft)
    window.location.reload()
  }

  return (
    <div className="min-h-full p-5 font-ui" style={{ background: BG, color: INK }}>
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">InTandem Console</div>
            <div className="text-xs" style={{ color: SUB }}>Family-notification demo controls · {RESIDENT.full}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={health.recheck}
              title="Click to re-check. The free tier sleeps after ~15 min idle; the first wake takes ~50s."
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-white/5"
              style={{ borderColor: LINE }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: health.checking ? '#f5a623' : health.ok ? '#34d399' : '#ef6b5b' }} />
              {health.checking ? 'waking…' : health.mode}
            </button>
            <a href="#/emr" target="_blank" rel="noreferrer" className="rounded border px-2.5 py-1 text-xs hover:bg-white/5" style={{ borderColor: LINE }}>
              Open /emr ↗
            </a>
            <Link to="/" className="text-xs" style={{ color: SUB }}>← Demos</Link>
          </div>
        </div>

        {/* Settings */}
        <Panel title="Setup">
          <div className="space-y-3">
            <div>
              <label className="text-xs" style={{ color: SUB }}>
                Backend URL — pre-filled; clear it to force simulation mode
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://intandem-emr-backend.onrender.com"
                  className="flex-1 rounded border px-2.5 py-1.5 text-sm"
                  style={{ background: BG, borderColor: LINE, color: INK }}
                />
                <button onClick={saveUrl} className="rounded px-3 py-1.5 text-sm font-semibold text-white" style={{ background: BLUE }}>
                  Save &amp; connect
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs" style={{ color: SUB }}>Target phone (E.164)</label>
                <input
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="+13035550142"
                  className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm"
                  style={{ background: BG, borderColor: LINE, color: INK }}
                />
              </div>
              <div>
                <label className="text-xs" style={{ color: SUB }}>Contact first name</label>
                <input
                  value={contactFirst}
                  onChange={(e) => setContactFirst(e.target.value)}
                  placeholder={CONTACT.first}
                  className="mt-1 w-full rounded border px-2.5 py-1.5 text-sm"
                  style={{ background: BG, borderColor: LINE, color: INK }}
                />
              </div>
            </div>
          </div>
        </Panel>

        {/* Commitment badge */}
        {commitmentOpen && (
          <div className="flex items-center gap-2 rounded-lg border-l-4 px-4 py-3 text-sm" style={{ background: '#2a2411', borderColor: '#f5a623', color: '#f5c065' }}>
            <span aria-hidden>⏳</span>
            <span className="font-semibold">1 open commitment</span>
            <span>— IV start → family call pending. Fire S3b to close it.</span>
          </div>
        )}

        {/* Scenario fire buttons */}
        <Panel title="Fire a scenario">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {SCENARIO_ORDER.map((id) => {
              const s = SCENARIOS[id]
              const locked = id === 'S3b' && !commitmentOpen
              const hero = id === 'S2'
              return (
                <button
                  key={id}
                  disabled={locked || busy}
                  onClick={() => fireScenario(id)}
                  className="rounded-lg border p-3 text-left transition-colors disabled:opacity-40"
                  style={{
                    borderColor: hero ? BLUE : LINE,
                    background: hero ? 'rgba(63,127,192,0.12)' : BG,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{id} · {s.label}</span>
                    {locked && <span className="text-[10px]" style={{ color: SUB }}>🔒 after S3a</span>}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: SUB }}>
                    {s.emrTrigger} · ~{s.targetSeconds}s
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs" style={{ color: SUB }}>
              {health.mode === 'simulation' ? 'No backend — calls are simulated.' : 'Calls placed via the backend.'}
            </span>
            <button onClick={resetDemo} className="rounded border px-3 py-1.5 text-xs hover:bg-white/5" style={{ borderColor: LINE, color: SUB }}>
              Reset demo
            </button>
          </div>
        </Panel>

        {/* Live status */}
        <Panel
          title="Call status"
          right={
            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: SUB }}>
              <span className="h-2 w-2 rounded-full" style={{ background: status === 'completed' ? '#34d399' : status === 'idle' ? '#4b5563' : '#3f7fc0' }} />
              {activeScenarioId ? `${activeScenarioId} · ` : ''}{status.replace('_', ' ')}
            </span>
          }
        >
          {transcript.length === 0 ? (
            <div className="text-sm" style={{ color: SUB }}>No active call.</div>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto text-sm">
              {transcript.map((t, i) => (
                <div key={i}>
                  <span className="font-semibold" style={{ color: t.speaker === 'assistant' ? BLUE : INK }}>
                    {t.speaker === 'assistant' ? 'Care Line' : CONTACT.first}:
                  </span>{' '}
                  <span style={{ color: INK }}>{t.text}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
