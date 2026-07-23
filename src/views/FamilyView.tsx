import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import {
  assessmentFor,
  getResident,
  goalsFor,
  notificationsFor,
  staff as staffList,
} from '@/store/selectors'
import { SENSOR_DOMAIN_IDS, DOMAINS } from '@/data/domains'
import { isOverdue } from '@/domain/assess'
import { latest } from '@/domain/series'
import { plainStatus } from '@/lib/plainLanguage'
import { formatLong, formatShort } from '@/lib/dates'
import { formatWithUnit } from '@/lib/format'
import { Avatar } from '@/components/Avatar'

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2.5 mt-7 font-display text-lg font-semibold text-spruce">{children}</h2>
}

export function FamilyView() {
  const { id } = useParams()
  const resident = id ? getResident(id) : undefined
  const actionItems = useStore((s) => s.actionItems)
  const notifications = useStore((s) => s.notifications)
  const summaries = useStore((s) => s.familySummaries)
  const submitQuestion = useStore((s) => s.submitFamilyQuestion)

  const assessment = useMemo(() => (id ? assessmentFor(id, actionItems) : null), [id, actionItems])
  const goals = id ? goalsFor(id) : []
  const items = actionItems.filter((a) => a.residentId === id)
  const notes = id ? notificationsFor(id, notifications) : []
  const latestSummary = summaries.find((s) => s.residentId === id)

  const [question, setQuestion] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!resident || !assessment) return <div className="p-8 text-slate">Resident not found.</div>

  const first = resident.name.split(' ')[0]
  const tiles = SENSOR_DOMAIN_IDS.map((did) => ({ did, da: assessment.sensor[did]! }))
    .filter((t) => t.da)
    .sort((a, b) => Number(plainStatus(b.da).tone === 'watch') - Number(plainStatus(a.da).tone === 'watch'))

  const submit = () => {
    if (!question.trim()) return
    submitQuestion(resident.id, question.trim(), `${resident.primaryContact.name} (${resident.primaryContact.relationship})`)
    setQuestion('')
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* Warm header */}
      <div className="flex items-center gap-3">
        <Avatar name={resident.name} size={52} />
        <div>
          <h1 className="font-display text-2xl font-semibold text-spruce">How is {first} doing?</h1>
          <p className="text-sm text-slate">Room {resident.room} · Fraser Pines</p>
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-glacier-wash px-3 py-2 text-sm text-glacier-ink">
        You’re seeing the same information as {first}’s care team, in plain language.
      </p>

      {/* Summary strip */}
      <SectionTitle>A quick look</SectionTitle>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {tiles.map(({ did, da }) => {
          const p = plainStatus(da)
          return (
            <div
              key={did}
              className={`rounded-lg border px-3 py-2.5 ${p.tone === 'watch' ? 'bg-watch-wash' : 'bg-stable-wash'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-soft">
                  {DOMAINS[did].shortLabel}
                </span>
                <span className={p.tone === 'watch' ? 'text-watch-ink' : 'text-stable-ink'} aria-hidden>
                  {p.glyph}
                </span>
              </div>
              <div className="mt-0.5 text-sm font-medium text-spruce">{p.text}</div>
            </div>
          )
        })}
      </div>

      {/* The Plan (verbatim from Zone B) */}
      <SectionTitle>{first}’s plan</SectionTitle>
      <div className="space-y-3">
        {goals.map((g) => {
          const da = assessment.sensor[g.domainId]
          const current = da ? (da.delta?.toValue ?? latest(da.series)?.value ?? g.currentValue) : g.currentValue
          const progress = clamp01(current / g.targetValue)
          return (
            <div key={g.id} className="rounded-lg border bg-paper-raised p-3.5 shadow-card">
              <div className="font-medium text-spruce">{g.plainLanguage}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-sunken">
                <div className="h-full rounded-full bg-glacier" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <div className="mt-1.5 text-xs text-slate">
                {DOMAINS[g.domainId].label} · goal: {g.targetMetric} · {g.owner.name} ({g.owner.role})
              </div>
            </div>
          )
        })}
      </div>

      {/* Commitments tracker — overdue NOT hidden (the trust feature) */}
      <SectionTitle>What we committed to</SectionTitle>
      <div className="space-y-2">
        {items.map((a) => {
          const overdue = isOverdue(a)
          const done = a.status === 'done'
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border bg-paper-raised px-3 py-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  done ? 'bg-stable text-white' : overdue ? 'border border-alert' : 'border border-line-strong'
                }`}
              >
                {done && (
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                )}
              </span>
              <span className="flex-1 text-sm text-spruce">{a.description}</span>
              <span
                className={`shrink-0 text-xs font-medium ${
                  done ? 'text-stable-ink' : overdue ? 'text-alert' : 'text-slate-soft'
                }`}
              >
                {done ? 'Done' : overdue ? 'Overdue' : 'In progress'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Latest family summary */}
      {latestSummary && (
        <>
          <SectionTitle>Your latest summary</SectionTitle>
          <Link
            to={`/summary/${latestSummary.id}`}
            className="flex items-center justify-between rounded-lg border border-l-4 border-l-glacier bg-glacier-wash px-4 py-3"
          >
            <div>
              <div className="font-medium text-spruce">Care conference summary</div>
              <div className="text-xs text-glacier-ink">Prepared {formatLong(latestSummary.date)}</div>
            </div>
            <span className="text-glacier-ink">→</span>
          </Link>
        </>
      )}

      {/* Notification history */}
      <SectionTitle>How we’ve kept you informed</SectionTitle>
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="rounded-lg border bg-paper-raised px-3 py-2 text-sm">
            <span className="text-spruce">We told you about {n.event}</span>
            <div className="text-xs text-slate-soft">
              {formatShort(n.date)} · by {n.loggedBy}
            </div>
          </div>
        ))}
      </div>

      {/* Submit a question */}
      <SectionTitle>Ask a question for the next conference</SectionTitle>
      {submitted ? (
        <div className="rounded-lg border border-l-4 border-l-stable bg-stable-wash px-4 py-3 text-sm text-spruce">
          Thank you — the care team will see your question before {first}’s next conference.
        </div>
      ) : (
        <div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder={`Anything you'd like the team to cover about ${first}…`}
            className="w-full rounded-lg border bg-paper-raised px-3 py-2 text-sm outline-none focus:border-glacier"
          />
          <button
            onClick={submit}
            disabled={!question.trim()}
            className="mt-2 w-full rounded-lg bg-glacier py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            Send to the care team
          </button>
        </div>
      )}

      {/* Next conference + attendees */}
      <SectionTitle>Next conference</SectionTitle>
      <div className="rounded-lg border bg-paper-raised p-4">
        <div className="font-medium text-spruce">{formatLong(resident.nextConferenceDate)}</div>
        <div className="mt-2 text-xs text-slate-soft">Who will be there</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {staffList.map((s) => (
            <span key={s.id} className="rounded-full bg-paper-sunken px-2 py-0.5 text-xs text-slate">
              {s.name} · {s.role}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-slate-soft">
        All information here is fictional. InTandem is a prototype — not a medical device.
      </p>
    </div>
  )
}
