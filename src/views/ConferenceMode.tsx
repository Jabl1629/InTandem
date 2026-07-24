import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { DomainId } from '@/types'
import { useStore } from '@/store/useStore'
import { staff as staffList } from '@/store/selectors'
import { assessmentFor, getResident, questionsFor } from '@/store/selectors'
import { DOMAINS } from '@/data/domains'
import { DISPLAY_DAYS } from '@/data/generate'
import { latest } from '@/domain/series'
import { buildAgenda, type AgendaItem } from '@/lib/agenda'
import { buildSummaryInput } from '@/lib/summary'
import { daysFromNowISO, formatShort, relativeDue } from '@/lib/dates'
import { formatWithUnit } from '@/lib/format'
import { deltaTone, toneChartColor } from '@/lib/status'
import { Avatar } from '@/components/Avatar'
import { StatusChip, OwnerChip } from '@/components/ui'
import { DeltaBand } from '@/components/DeltaBand'
import { Sparkline } from '@/components/Sparkline'
import { ProvenanceIcon } from '@/components/ProvenanceIcon'

const AGENDA_ICON: Record<AgendaItem['kind'], string> = { domain: '📈', commitment: '⏰', question: '💬' }

function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function ConferenceMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const resident = id ? getResident(id) : undefined

  const actionItems = useStore((s) => s.actionItems)
  const conferences = useStore((s) => s.conferences)
  const familyQuestions = useStore((s) => s.familyQuestions)
  const live = useStore((s) => s.live)
  const startConference = useStore((s) => s.startConference)
  const toggleAgendaItem = useStore((s) => s.toggleAgendaItem)
  const addDecision = useStore((s) => s.addDecision)
  const addActionItem = useStore((s) => s.addActionItem)
  const answerFamilyQuestion = useStore((s) => s.answerFamilyQuestion)
  const endConference = useStore((s) => s.endConference)

  const assessment = useMemo(() => (id ? assessmentFor(id, actionItems) : null), [id, actionItems])
  const residentActionItems = useMemo(() => actionItems.filter((a) => a.residentId === id), [actionItems, id])
  const questions = questionsFor(id ?? '', familyQuestions)

  // Ensure a live session exists (entry may be direct navigation from a banner).
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current || !id) return
    if (!live || live.residentId !== id) startConference(id)
    startedRef.current = true
  }, [id, live, startConference])

  // Snapshot the agenda at meeting start so it stays stable as we capture.
  const [agenda] = useState<AgendaItem[]>(() =>
    assessment ? buildAgenda(assessment, residentActionItems, questions) : [],
  )
  const [selected, setSelected] = useState<string | undefined>(() => agenda[0]?.id)

  // Elapsed timer
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!resident || !assessment) return <div className="p-8 text-slate">Resident not found.</div>

  const checked = live?.checkedAgendaIds ?? []
  const liveConf = conferences.find((c) => c.id === live?.conferenceId)
  const capturedItems = actionItems.filter((a) => a.createdInConferenceId === live?.conferenceId)
  const elapsed = live ? now - live.startedAtMs : 0
  const selectedItem = agenda.find((a) => a.id === selected)

  const end = () => {
    if (!live || !liveConf) return
    const input = buildSummaryInput(resident, assessment, liveConf, residentActionItems, questions, agenda, checked)
    const summary = endConference(input)
    navigate(`/huddle/summary/${summary.id}`)
  }

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b bg-paper-raised px-6 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={resident.name} size={40} />
          <div>
            <div className="font-display text-lg font-semibold text-spruce">{resident.name}</div>
            <div className="text-xs text-slate">Significant-change conference · Fraser Pines</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="tnum rounded-full bg-paper-sunken px-3 py-1 text-sm font-medium text-spruce">
            {fmtElapsed(elapsed)}
          </span>
          <button
            onClick={() => navigate(`/huddle/resident/${resident.id}`)}
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate hover:bg-paper-sunken"
          >
            Exit
          </button>
          <button
            onClick={end}
            className="rounded-md bg-spruce px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            End conference →
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr_340px]">
        {/* Left — agenda */}
        <aside className="flex flex-col overflow-y-auto scroll-quiet border-r bg-paper p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-spruce">Agenda</h2>
            <span className="text-xs text-slate-soft">
              {checked.length}/{agenda.length} covered
            </span>
          </div>
          <div className="space-y-1.5">
            {agenda.map((item, i) => {
              const isChecked = checked.includes(item.id)
              const isActive = item.id === selected
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-2 rounded-lg border p-2.5 animate-settle ${
                    isActive ? 'border-spruce bg-paper-raised shadow-card' : 'bg-paper-raised'
                  }`}
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <button
                    onClick={() => toggleAgendaItem(item.id)}
                    aria-label="Toggle covered"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isChecked ? 'border-stable bg-stable text-white' : 'border-line-strong'
                    }`}
                  >
                    {isChecked && (
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M3.5 8.5l3 3 6-7" />
                      </svg>
                    )}
                  </button>
                  <button onClick={() => setSelected(item.id)} className="min-w-0 flex-1 text-left">
                    <div className={`text-sm ${isChecked ? 'text-slate-soft line-through' : 'text-spruce'}`}>
                      <span className="mr-1">{AGENDA_ICON[item.kind]}</span>
                      {item.title}
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Center — current item, enlarged */}
        <main className="overflow-y-auto scroll-quiet p-8">
          {agenda.length === 0 ? (
            <div className="mx-auto max-w-lg pt-16 text-center animate-settle">
              <div className="font-display text-2xl font-semibold text-spruce">Nothing flagged</div>
              <p className="mt-2 text-sm text-slate">
                This is a routine check-in — no domains crossed a threshold. Capture any decisions or action items on
                the right, then end the conference to generate the family summary.
              </p>
            </div>
          ) : selectedItem ? (
            <CenterDetail
              item={selectedItem}
              assessment={assessment}
              lastConferenceDate={resident.lastConferenceDate}
              actionItems={actionItems}
              questions={questions}
              onAnswer={answerFamilyQuestion}
            />
          ) : (
            <div className="text-slate-soft">Select an agenda item.</div>
          )}
        </main>

        {/* Right — capture panel */}
        <aside className="flex flex-col overflow-y-auto scroll-quiet border-l bg-paper p-4">
          <h2 className="mb-2 text-sm font-semibold text-spruce">Capture</h2>
          <CapturePanel
            residentId={resident.id}
            conferenceId={live?.conferenceId}
            onDecision={addDecision}
            onActionItem={addActionItem}
          />

          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-soft">
              Captured this meeting
            </h3>
            <div className="space-y-1.5">
              {(liveConf?.decisions ?? []).map((d) => (
                <div key={d.id} className="rounded-md border bg-paper-raised px-2.5 py-1.5 text-xs">
                  <span className="font-medium text-spruce">Decision:</span> <span className="text-slate">{d.text}</span>
                </div>
              ))}
              {capturedItems.map((a) => (
                <div key={a.id} className="rounded-md border bg-paper-raised px-2.5 py-1.5 text-xs">
                  <span className="font-medium text-spruce">Action:</span>{' '}
                  <span className="text-slate">
                    {a.description} — {a.owner.name}, {relativeDue(a.dueDate)}
                  </span>
                </div>
              ))}
              {questions.filter((q) => q.answer).map((q) => (
                <div key={q.id} className="rounded-md border bg-glacier-wash px-2.5 py-1.5 text-xs">
                  <span className="font-medium text-glacier-ink">Answered:</span>{' '}
                  <span className="text-slate">{q.question}</span>
                </div>
              ))}
              {!liveConf?.decisions.length && !capturedItems.length && !questions.some((q) => q.answer) && (
                <p className="text-xs text-slate-soft">Decisions and action items you capture appear here.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ---------------- Center detail ----------------
function CenterDetail({
  item,
  assessment,
  lastConferenceDate,
  actionItems,
  questions,
  onAnswer,
}: {
  item: AgendaItem
  assessment: ReturnType<typeof assessmentFor>
  lastConferenceDate: string
  actionItems: ReturnType<typeof useStore.getState>['actionItems']
  questions: ReturnType<typeof questionsFor>
  onAnswer: (id: string, answer: string) => void
}) {
  if (item.kind === 'domain' && item.domainId && assessment) {
    const da = assessment.sensor[item.domainId as DomainId]
    if (!da) return null
    const domain = DOMAINS[da.domainId]
    const tone = deltaTone(da.status.status, da.delta)
    const current = da.delta?.toValue ?? latest(da.series)?.value ?? 0
    return (
      <div className="mx-auto max-w-2xl animate-settle">
        <div className="mb-1 flex items-center gap-1.5 text-sm text-slate-soft">
          <ProvenanceIcon provenance={domain.provenance} />
          {domain.source}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold text-spruce">{domain.label}</h1>
          <StatusChip status={da.status.status} />
        </div>
        <div className="mt-4 font-display text-6xl font-semibold tnum text-spruce">
          {formatWithUnit(domain, current)}
        </div>
        <div className="mt-2">
          <DeltaBand domain={domain} delta={da.delta} tone={tone} size="lg" />
        </div>
        <div className="mt-6 rounded-xl border bg-paper-raised p-4 shadow-card">
          <Sparkline data={da.series.slice(-DISPLAY_DAYS)} refDate={lastConferenceDate} color={toneChartColor(tone)} height={220} showRefLabel />
        </div>
        <div className="mt-4 rounded-lg bg-paper-sunken px-4 py-3 text-sm text-spruce">
          <span className="font-semibold">Why this is flagged:</span> {da.status.reason}
        </div>
      </div>
    )
  }

  if (item.kind === 'commitment') {
    const itemId = item.id.replace('agenda-commitment-', '')
    const ai = actionItems.find((a) => a.id === itemId)
    if (!ai) return null
    return (
      <div className="mx-auto max-w-2xl animate-settle">
        <div className="text-sm text-slate-soft">Overdue commitment</div>
        <h1 className="mt-1 font-display text-3xl font-semibold text-spruce">{ai.description}</h1>
        <div className="mt-4 flex items-center gap-3">
          <OwnerChip staff={ai.owner} />
          <span className="text-sm font-medium text-alert">{relativeDue(ai.dueDate)}</span>
        </div>
        <p className="mt-6 max-w-lg text-sm text-slate">
          Discuss where this stands and, if it's been handled, mark it done in the commitments list — or capture a
          fresh action item on the right with a new owner and date.
        </p>
      </div>
    )
  }

  // question
  const qId = item.id.replace('agenda-question-', '')
  const q = questions.find((x) => x.id === qId)
  if (!q) return null
  return <QuestionDetail question={q.question} askedBy={q.askedBy} answer={q.answer} onSave={(a) => onAnswer(qId, a)} />
}

function QuestionDetail({
  question,
  askedBy,
  answer,
  onSave,
}: {
  question: string
  askedBy: string
  answer?: string
  onSave: (answer: string) => void
}) {
  const [text, setText] = useState(answer ?? '')
  return (
    <div className="mx-auto max-w-2xl animate-settle">
      <div className="text-sm text-slate-soft">Family question</div>
      <div className="mt-2 rounded-xl border border-l-4 border-l-glacier bg-glacier-wash p-4">
        <p className="font-display text-xl text-spruce">“{question}”</p>
        <p className="mt-1 text-sm text-glacier-ink">— {askedBy}</p>
      </div>
      <div className="mt-4">
        <label className="text-sm font-medium text-spruce">Answer for the family summary</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Type the answer the family will see…"
          className="mt-1.5 w-full rounded-lg border bg-paper-raised px-3 py-2 text-sm outline-none focus:border-glacier"
        />
        <button
          onClick={() => onSave(text)}
          disabled={!text.trim()}
          className="mt-2 rounded-md bg-glacier px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {answer ? 'Update answer' : 'Save answer'}
        </button>
        {answer && <span className="ml-2 text-xs text-stable-ink">✓ Answered</span>}
      </div>
    </div>
  )
}

// ---------------- Capture panel forms ----------------
function CapturePanel({
  residentId,
  conferenceId,
  onDecision,
  onActionItem,
}: {
  residentId: string
  conferenceId?: string
  onDecision: (conferenceId: string, text: string, by?: string) => void
  onActionItem: ReturnType<typeof useStore.getState>['addActionItem']
}) {
  const [decision, setDecision] = useState('')
  const [desc, setDesc] = useState('')
  const [ownerId, setOwnerId] = useState(staffList[0].id)
  const [due, setDue] = useState(daysFromNowISO(7))

  const saveDecision = () => {
    if (!decision.trim() || !conferenceId) return
    onDecision(conferenceId, decision.trim(), 'Care team')
    setDecision('')
  }
  const saveItem = () => {
    if (!desc.trim()) return
    const owner = staffList.find((s) => s.id === ownerId)!
    onActionItem({ residentId, description: desc.trim(), owner, dueDate: due, status: 'open', createdInConferenceId: conferenceId })
    setDesc('')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-paper-raised p-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-soft">Log a decision</label>
        <textarea
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          rows={2}
          placeholder="What did the team decide?"
          className="mt-1.5 w-full rounded-md border bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-glacier"
        />
        <button onClick={saveDecision} className="mt-1.5 w-full rounded-md bg-spruce py-1.5 text-sm font-semibold text-white hover:opacity-90">
          Log decision
        </button>
      </div>

      <div className="rounded-lg border bg-paper-raised p-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-soft">Assign an action item</label>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What needs to happen?"
          className="mt-1.5 w-full rounded-md border bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-glacier"
        />
        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="mt-1.5 w-full rounded-md border bg-paper px-2 py-1.5 text-sm"
        >
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.role}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="mt-1.5 w-full rounded-md border bg-paper px-2 py-1.5 text-sm"
        />
        <button onClick={saveItem} className="mt-1.5 w-full rounded-md bg-spruce py-1.5 text-sm font-semibold text-white hover:opacity-90">
          Assign to owner
        </button>
      </div>
    </div>
  )
}
