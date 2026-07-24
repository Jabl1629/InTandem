import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT, FACILITY, RESIDENT, SCENARIOS } from './constants'
import type { PostedNote } from './emrStore'
import { useEmr } from './emrStore'

// ── Demo EHR palette (deliberately generic enterprise blues/grays) ──
const NAVY = '#1f3a5f'
const BLUE = '#2f5d86'
const INK = '#1f2733'
const SUB = '#5b6675'
const LINE = '#d5dbe3'
const BG = '#eef1f5'

const CENSUS = [
  { room: '208', name: 'Arthur Bennett', mrn: 'FR-0002081', status: 'Stable' },
  { room: '210', name: 'Rosa Iglesias', mrn: 'FR-0002102', status: 'Stable' },
  { room: '212', name: 'Walter Kim', mrn: 'FR-0002121', status: 'Stable' },
  { room: RESIDENT.room, name: RESIDENT.full, mrn: RESIDENT.mrn, status: 'Active order', me: true },
  { room: '216', name: 'Doris Feldman', mrn: 'FR-0002161', status: 'Stable' },
  { room: '218', name: 'Sam Whitfield', mrn: 'FR-0002181', status: 'Stable' },
]

const BASE_ORDERS = [
  { drug: 'Amlodipine 5 mg tablet', sig: '5 mg PO daily', provider: 'Reyes, A.', status: 'Active' },
  { drug: 'Atorvastatin 20 mg tablet', sig: '20 mg PO at bedtime', provider: 'Reyes, A.', status: 'Active' },
  { drug: 'Vitamin D3 1000 unit capsule', sig: '1000 units PO daily', provider: 'Reyes, A.', status: 'Active' },
  { drug: 'Acetaminophen 500 mg tablet', sig: '500 mg PO q6h PRN — knee pain', provider: 'Reyes, A.', status: 'Active' },
]

function fmtTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ── Top bar ──
function TopBar() {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-white" style={{ background: NAVY }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Demo EHR
        </div>
        <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-medium">
          DEMO ENVIRONMENT — fictional residents
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-white/80">
        <span>{FACILITY.name} · Skilled Nursing</span>
        <span>Nurse: A. Chen, RN</span>
        <Link to="/" className="rounded border border-white/25 px-2 py-1 hover:bg-white/10">
          ← Demos
        </Link>
      </div>
    </div>
  )
}

// ── Census ──
function Census({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-lg font-semibold" style={{ color: INK }}>
        Unit Census · 2 West
      </h1>
      <p className="mb-4 text-sm" style={{ color: SUB }}>
        Select a resident to open the chart.
      </p>
      <div className="overflow-hidden rounded border bg-white" style={{ borderColor: LINE }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide" style={{ background: BG, color: SUB }}>
              <th className="px-4 py-2 font-semibold">Room</th>
              <th className="px-4 py-2 font-semibold">Resident</th>
              <th className="px-4 py-2 font-semibold">MRN</th>
              <th className="px-4 py-2 font-semibold">Flags</th>
            </tr>
          </thead>
          <tbody>
            {CENSUS.map((r) => (
              <tr
                key={r.mrn}
                onClick={r.me ? onOpen : undefined}
                className={`border-t ${r.me ? 'cursor-pointer hover:bg-[#e8eef5]' : 'opacity-60'}`}
                style={{ borderColor: LINE }}
              >
                <td className="px-4 py-2.5 font-medium" style={{ color: INK }}>{r.room}</td>
                <td className="px-4 py-2.5" style={{ color: r.me ? BLUE : INK }}>
                  <span className={r.me ? 'font-semibold' : ''}>{r.name}</span>
                </td>
                <td className="px-4 py-2.5 tabular-nums" style={{ color: SUB }}>{r.mrn}</td>
                <td className="px-4 py-2.5">
                  {r.me && (
                    <span className="rounded-full bg-[#e8eef5] px-2 py-0.5 text-[11px] font-medium" style={{ color: BLUE }}>
                      New order pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Patient banner ──
function PatientBanner({ commitmentOpen }: { commitmentOpen: boolean }) {
  const Item = ({ label, value, danger }: { label: string; value: string; danger?: boolean }) => (
    <div>
      <div className="text-[10px] uppercase tracking-wide" style={{ color: SUB }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: danger ? '#b3402f' : INK }}>{value}</div>
    </div>
  )
  return (
    <div className="border-b bg-white px-5 py-3" style={{ borderColor: LINE }}>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <div>
          <div className="text-lg font-bold" style={{ color: INK }}>
            {RESIDENT.full}
          </div>
          <div className="text-xs" style={{ color: SUB }}>
            {RESIDENT.age} yr · {RESIDENT.sex} · DOB {RESIDENT.dob} · MRN {RESIDENT.mrn}
          </div>
        </div>
        <Item label="Room / Bed" value={`${RESIDENT.room} · A`} />
        <Item label="Allergies" value={RESIDENT.allergies} danger />
        <Item label="Code" value={RESIDENT.code} />
        <Item label="Diet" value={RESIDENT.diet} />
        <Item label="Attending" value={RESIDENT.attending} />
        <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: SUB }}>
          <span className="text-[10px] uppercase tracking-wide">Contact</span>
          <span className="font-medium" style={{ color: INK }}>
            {CONTACT.full} ({CONTACT.relation})
          </span>
        </div>
      </div>
      {commitmentOpen && (
        <div className="mt-2.5 flex items-center gap-2 rounded border-l-4 px-3 py-1.5 text-sm" style={{ background: '#fff5e6', borderColor: '#b7791f', color: '#8a5c15' }}>
          <span aria-hidden>⏳</span>
          <span className="font-semibold">1 open commitment</span>
          <span>— IV start → family call pending</span>
        </div>
      )}
    </div>
  )
}

// ── Progress note (the receipt / money screen) ──
function ProgressNote({ note }: { note: PostedNote }) {
  const [open, setOpen] = useState(false)
  const s = SCENARIOS[note.scenarioId]
  return (
    <div className="rounded border bg-white p-4" style={{ borderColor: LINE }}>
      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: LINE }}>
        <div className="font-semibold" style={{ color: INK }}>{note.title}</div>
        <div className="text-xs" style={{ color: SUB }}>{fmtTime(note.postedAt)} · Automated Care Line</div>
      </div>
      <dl className="mt-3 grid grid-cols-[150px_1fr] gap-y-1.5 text-sm" style={{ color: INK }}>
        <dt style={{ color: SUB }}>Notified</dt>
        <dd>{CONTACT.full} ({CONTACT.relation}), by phone</dd>
        <dt style={{ color: SUB }}>Identity confirmed</dt>
        <dd>{note.extraction.contact_identity_confirmed ? 'Yes' : 'No'}</dd>
        <dt style={{ color: SUB }}>Communicated</dt>
        <dd>{note.extraction.summary_for_chart}</dd>
        <dt style={{ color: SUB }}>Family acknowledgment</dt>
        <dd>{note.extraction.acknowledgment_received ? 'Received' : 'Not received'}</dd>
        <dt style={{ color: SUB }}>Nurse callback</dt>
        <dd>{note.extraction.nurse_callback_requested ? `Requested — ${note.extraction.callback_topic ?? 'see transcript'}` : 'Not requested'}</dd>
      </dl>
      <button onClick={() => setOpen((v) => !v)} className="mt-3 text-xs font-medium hover:underline" style={{ color: BLUE }}>
        {open ? '▾ Hide' : '▸ View'} full call transcript
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded p-3" style={{ background: BG }}>
          {note.transcript.map((t, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold" style={{ color: t.speaker === 'assistant' ? BLUE : INK }}>
                {t.speaker === 'assistant' ? 'Care Line' : CONTACT.first}:
              </span>{' '}
              <span style={{ color: INK }}>{t.text}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 border-t pt-2 text-[11px]" style={{ borderColor: LINE, color: SUB }}>
        Call type: {s?.callType} · Electronically documented by GoSteady Automated Care Line
      </div>
    </div>
  )
}

// ── Order entry ──
function NewOrderForm({ onSign, onCancel }: { onSign: () => void; onCancel: () => void }) {
  const o = SCENARIOS.S2.order!
  return (
    <div className="rounded border bg-white p-4" style={{ borderColor: BLUE }}>
      <div className="mb-3 font-semibold" style={{ color: INK }}>New Medication Order</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Medication" value={o.drug} />
        <Field label="Dose" value={o.dose} />
        <Field label="Route" value={o.route} />
        <Field label="Frequency" value={o.frequency} />
        <Field label="Ordering provider" value={o.provider} />
        <Field label="Indication" value={o.indication} />
      </div>
      <label className="mt-3 flex items-start gap-2 rounded p-2 text-xs" style={{ background: '#e8eef5', color: BLUE }}>
        <input type="checkbox" checked readOnly className="mt-0.5" />
        <span>
          Notify designated contact of this change — <strong>{CONTACT.full} ({CONTACT.relation})</strong> · required by
          facility policy
        </span>
      </label>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded border px-3 py-1.5 text-sm" style={{ borderColor: LINE, color: SUB }}>
          Cancel
        </button>
        <button onClick={onSign} className="rounded px-4 py-1.5 text-sm font-semibold text-white" style={{ background: BLUE }}>
          Sign &amp; save order
        </button>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide" style={{ color: SUB }}>{label}</div>
      <div className="rounded border px-2.5 py-1.5" style={{ borderColor: LINE, color: INK }}>{value}</div>
    </div>
  )
}

// ── Call dock (live status + transcript) ──
function CallDock() {
  const status = useEmr((s) => s.status)
  const transcript = useEmr((s) => s.transcript)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript.length])

  if (status === 'idle') return null
  const label =
    status === 'queued' ? 'Queued' : status === 'ringing' ? 'Ringing…' : status === 'in_progress' ? 'On the call' : 'Call complete'
  const dot = status === 'completed' ? '#1f7a4d' : status === 'in_progress' ? '#2f5d86' : '#b7791f'

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l bg-white" style={{ borderColor: LINE }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: LINE }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: INK }}>Family Notification Line</div>
          <div className="text-[11px]" style={{ color: SUB }}>Outbound · recorded · AI-disclosed</div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium" style={{ background: BG, color: INK }}>
          <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
          {label}
        </span>
      </div>

      {(status === 'queued' || status === 'ringing') && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#e8eef5' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" className={status === 'ringing' ? 'animate-pulse' : ''}>
              <path d="M6.5 3.5c1 3 3 5.5 6 7.5s5.5 3 8 3l-2 4c-6-1-11-6-14-14Z" />
            </svg>
          </div>
          <div className="text-sm font-medium" style={{ color: INK }}>Calling {CONTACT.full} ({CONTACT.relation})</div>
          <div className="text-xs" style={{ color: SUB }}>{status === 'queued' ? 'Placing call…' : 'Ringing…'}</div>
        </div>
      )}

      {(status === 'in_progress' || status === 'completed') && (
        <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {transcript.map((t, i) => (
            <div key={i} className={`flex ${t.speaker === 'assistant' ? 'justify-start' : 'justify-end'}`}>
              <div
                className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
                style={
                  t.speaker === 'assistant'
                    ? { background: '#e8eef5', color: INK }
                    : { background: NAVY, color: 'white' }
                }
              >
                {t.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'completed' && (
        <div className="border-t px-4 py-3 text-sm" style={{ borderColor: LINE, background: '#eefaf2', color: '#1f7a4d' }}>
          ✓ Progress note posted to chart
        </div>
      )}
      <div className="border-t px-4 py-1.5 text-center text-[10px]" style={{ borderColor: LINE, color: SUB }}>
        simulated call · real ElevenLabs backend wires in next
      </div>
    </aside>
  )
}

// ── Toast ──
function Toast() {
  const toast = useEmr((s) => s.toast)
  if (!toast) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg animate-settle" style={{ background: NAVY }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6.5 3.5c1 3 3 5.5 6 7.5s5.5 3 8 3" />
      </svg>
      {toast}
    </div>
  )
}

// ── Main ──
export function EmrDemo() {
  const [view, setView] = useState<'census' | 'chart'>('census')
  const [tab, setTab] = useState<'orders' | 'notes'>('orders')
  const [adding, setAdding] = useState(false)
  const [signed, setSigned] = useState(false)

  const status = useEmr((s) => s.status)
  const notes = useEmr((s) => s.notes)
  const commitmentOpen = useEmr((s) => s.commitmentOpen)
  const fireScenario = useEmr((s) => s.fireScenario)
  const resetDemo = useEmr((s) => s.resetDemo)

  const orders = useMemo(
    () =>
      signed
        ? [{ drug: SCENARIOS.S2.order!.drug, sig: '5 mg PO daily — evening pass', provider: 'Reyes, A.', status: 'Active — new' }, ...BASE_ORDERS]
        : BASE_ORDERS,
    [signed],
  )

  const sign = () => {
    setSigned(true)
    setAdding(false)
    fireScenario('S2')
  }

  // When a note posts, nudge attention to the Progress Notes tab.
  useEffect(() => {
    if (status === 'completed') setTab('notes')
  }, [status])

  const NAV = [
    { id: 'summary', label: 'Summary' },
    { id: 'orders', label: 'Orders' },
    { id: 'emar', label: 'eMAR' },
    { id: 'notes', label: 'Progress Notes' },
    { id: 'vitals', label: 'Vitals' },
    { id: 'demographics', label: 'Demographics' },
  ]

  return (
    <div className="flex min-h-full flex-col font-ui" style={{ background: BG, color: INK }}>
      <TopBar />

      {view === 'census' ? (
        <Census onOpen={() => setView('chart')} />
      ) : (
        <>
          <div className="flex items-center gap-2 px-5 py-1.5 text-xs" style={{ color: SUB }}>
            <button onClick={() => setView('census')} className="hover:underline">Census</button>
            <span>/</span>
            <span style={{ color: INK }}>{RESIDENT.full}</span>
            <button
              onClick={() => { resetDemo(); setSigned(false); setTab('orders'); setAdding(false) }}
              className="ml-auto rounded border px-2 py-0.5 hover:bg-white"
              style={{ borderColor: LINE }}
            >
              Reset demo
            </button>
          </div>
          <PatientBanner commitmentOpen={commitmentOpen} />

          <div className="flex min-h-0 flex-1">
            {/* Chart nav */}
            <nav className="w-44 shrink-0 border-r bg-white py-2" style={{ borderColor: LINE }}>
              {NAV.map((n) => {
                const active = (n.id === 'orders' && tab === 'orders') || (n.id === 'notes' && tab === 'notes')
                const clickable = n.id === 'orders' || n.id === 'notes'
                return (
                  <button
                    key={n.id}
                    onClick={() => clickable && setTab(n.id as 'orders' | 'notes')}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${clickable ? '' : 'cursor-default opacity-50'}`}
                    style={active ? { background: '#e8eef5', color: BLUE, fontWeight: 600, boxShadow: `inset 3px 0 0 ${BLUE}` } : { color: INK }}
                  >
                    {n.label}
                    {n.id === 'notes' && notes.length > 0 && (
                      <span className="rounded-full px-1.5 text-[10px] font-semibold text-white" style={{ background: BLUE }}>
                        {notes.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Main content */}
            <main className="min-w-0 flex-1 overflow-y-auto p-5">
              {tab === 'orders' && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold" style={{ color: INK }}>Active Orders</h2>
                    {!adding && !signed && (
                      <button onClick={() => setAdding(true)} className="rounded px-3 py-1.5 text-sm font-semibold text-white" style={{ background: BLUE }}>
                        + New Order
                      </button>
                    )}
                  </div>
                  {adding && (
                    <div className="mb-4">
                      <NewOrderForm onSign={sign} onCancel={() => setAdding(false)} />
                    </div>
                  )}
                  <div className="overflow-hidden rounded border bg-white" style={{ borderColor: LINE }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide" style={{ background: BG, color: SUB }}>
                          <th className="px-4 py-2 font-semibold">Medication</th>
                          <th className="px-4 py-2 font-semibold">Sig</th>
                          <th className="px-4 py-2 font-semibold">Provider</th>
                          <th className="px-4 py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o, i) => (
                          <tr key={i} className="border-t" style={{ borderColor: LINE, background: o.status.includes('new') ? '#eefaf2' : 'white' }}>
                            <td className="px-4 py-2.5 font-medium" style={{ color: INK }}>{o.drug}</td>
                            <td className="px-4 py-2.5" style={{ color: SUB }}>{o.sig}</td>
                            <td className="px-4 py-2.5" style={{ color: SUB }}>{o.provider}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs font-medium" style={{ color: o.status.includes('new') ? '#1f7a4d' : SUB }}>{o.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === 'notes' && (
                <>
                  <h2 className="mb-3 text-base font-semibold" style={{ color: INK }}>Progress Notes</h2>
                  {notes.length === 0 ? (
                    <div className="rounded border border-dashed bg-white p-8 text-center text-sm" style={{ borderColor: LINE, color: SUB }}>
                      No notes yet. Sign a medication order to generate a family-notification note.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((n) => (
                        <ProgressNote key={n.id} note={n} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </main>

            <CallDock />
          </div>
        </>
      )}

      <Toast />
    </div>
  )
}
