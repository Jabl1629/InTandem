import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NotificationChannel, Resident } from '@/types'
import type { ResidentAssessment } from '@/domain/assess'
import { isOverdue } from '@/domain/assess'
import { useStore } from '@/store/useStore'
import { staff as staffList } from '@/store/selectors'
import { conferencesFor, notificationsFor, questionsFor } from '@/store/selectors'
import { daysFromNowISO, formatLong, formatShort, relativeDue } from '@/lib/dates'
import { OwnerChip } from './ui'
import { PreMeetingBriefModal } from './PreMeetingBriefModal'

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  phone: 'phone',
  portal: 'portal',
  'in-person': 'in person',
}

function SubHead({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-spruce">{children}</h3>
      {action}
    </div>
  )
}

// ---------------- Action items ----------------
function ActionItems({ residentId }: { residentId: string }) {
  const all = useStore((s) => s.actionItems)
  const toggle = useStore((s) => s.toggleActionItem)
  const addActionItem = useStore((s) => s.addActionItem)
  const items = all.filter((a) => a.residentId === residentId)

  const [adding, setAdding] = useState(false)
  const [desc, setDesc] = useState('')
  const [ownerId, setOwnerId] = useState(staffList[0].id)
  const [due, setDue] = useState(daysFromNowISO(7))

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const rank = (x: typeof a) => (isOverdue(x) ? 0 : x.status === 'done' ? 2 : 1)
        return rank(a) - rank(b)
      }),
    [items],
  )

  const save = () => {
    if (!desc.trim()) return
    const owner = staffList.find((s) => s.id === ownerId)!
    addActionItem({ residentId, description: desc.trim(), owner, dueDate: due, status: 'open' })
    setDesc('')
    setAdding(false)
  }

  return (
    <div>
      <SubHead
        action={
          <button
            onClick={() => setAdding((v) => !v)}
            className="rounded-md border px-2 py-1 text-xs font-medium text-slate hover:bg-paper-sunken hover:text-spruce"
          >
            + Add action item
          </button>
        }
      >
        Action items
      </SubHead>

      <div className="overflow-hidden rounded-lg border">
        {sorted.map((a, i) => {
          const overdue = isOverdue(a)
          const done = a.status === 'done'
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 border-b px-3 py-2.5 last:border-0 ${
                overdue ? 'bg-alert-wash/50' : i % 2 ? 'bg-paper' : 'bg-paper-raised'
              }`}
            >
              <button
                onClick={() => toggle(a.id)}
                aria-label={done ? 'Mark open' : 'Mark done'}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  done ? 'border-stable bg-stable text-white' : overdue ? 'border-alert' : 'border-line-strong'
                }`}
              >
                {done && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${done ? 'text-slate-soft line-through' : 'text-spruce'}`}>
                  {a.description}
                  {a.capturedLive && (
                    <span className="ml-2 rounded bg-glacier-wash px-1.5 py-0.5 text-[10px] font-medium text-glacier-ink">
                      new
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs">
                  <OwnerChip staff={a.owner} />
                  <span className={overdue ? 'font-medium text-alert' : 'text-slate-soft'}>
                    {formatShort(a.dueDate)} · {done ? 'done' : relativeDue(a.dueDate)}
                  </span>
                </div>
              </div>
              {overdue && (
                <span className="shrink-0 rounded-full bg-alert px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Overdue
                </span>
              )}
            </div>
          )
        })}

        {adding && (
          <div className="space-y-2 border-t bg-paper p-3">
            <input
              autoFocus
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="What needs to happen?"
              className="w-full rounded-md border bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-glacier"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="rounded-md border bg-paper-raised px-2 py-1.5 text-sm"
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
                className="rounded-md border bg-paper-raised px-2 py-1.5 text-sm"
              />
              <button
                onClick={save}
                className="ml-auto rounded-md bg-spruce px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------- Decision log ----------------
function DecisionLog({ residentId }: { residentId: string }) {
  const conferences = useStore((s) => s.conferences)
  const list = conferencesFor(residentId, conferences)
  const decisions = list.flatMap((c) => c.decisions.map((d) => ({ ...d, type: c.type })))

  if (!decisions.length) return null
  return (
    <div>
      <SubHead>Decision log</SubHead>
      <ol className="relative space-y-3 border-l pl-4">
        {decisions.map((d) => (
          <li key={d.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-soft" />
            <div className="text-sm text-spruce">{d.text}</div>
            <div className="text-xs text-slate-soft">
              {formatLong(d.date)}
              {d.by ? ` · ${d.by}` : ''}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ---------------- Notification log ----------------
function NotificationLog({ residentId }: { residentId: string }) {
  const notifications = useStore((s) => s.notifications)
  const addNotification = useStore((s) => s.addNotification)
  const list = notificationsFor(residentId, notifications)

  const [adding, setAdding] = useState(false)
  const [event, setEvent] = useState('')
  const [channel, setChannel] = useState<NotificationChannel>('phone')

  const save = () => {
    if (!event.trim()) return
    addNotification(residentId, event.trim(), channel, 'You (demo)')
    setEvent('')
    setAdding(false)
  }

  return (
    <div>
      <SubHead
        action={
          <button
            onClick={() => setAdding((v) => !v)}
            className="rounded-md border px-2 py-1 text-xs font-medium text-slate hover:bg-paper-sunken hover:text-spruce"
          >
            + Log a notification
          </button>
        }
      >
        Notification log
      </SubHead>

      {adding && (
        <div className="mb-2 space-y-2 rounded-lg border bg-paper p-3">
          <input
            autoFocus
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="What was the family told?"
            className="w-full rounded-md border bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-glacier"
          />
          <div className="flex items-center gap-2">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as NotificationChannel)}
              className="rounded-md border bg-paper-raised px-2 py-1.5 text-sm"
            >
              <option value="phone">Phone</option>
              <option value="portal">Portal</option>
              <option value="in-person">In person</option>
            </select>
            <button
              onClick={save}
              className="ml-auto rounded-md bg-spruce px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Log it
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-1.5">
        {list.map((n) => (
          <li key={n.id} className="flex items-start gap-2 rounded-md border bg-paper-raised px-3 py-2 text-sm">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--glacier)" strokeWidth="1.4" className="mt-0.5 shrink-0">
              <path d="M3 4.5h10v7H8l-3 2.5v-2.5H3z" />
            </svg>
            <div>
              <span className="text-spruce">Family notified of {n.event}</span>
              <div className="text-xs text-slate-soft">
                {formatLong(n.date)} · via {CHANNEL_LABEL[n.channel]} · by {n.loggedBy}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CommitmentsZone({
  resident,
  assessment,
}: {
  resident: Resident
  assessment: ResidentAssessment
}) {
  const navigate = useNavigate()
  const actionItems = useStore((s) => s.actionItems).filter((a) => a.residentId === resident.id)
  const questions = questionsFor(
    resident.id,
    useStore((s) => s.familyQuestions),
  )
  const live = useStore((s) => s.live)
  const startConference = useStore((s) => s.startConference)
  const [briefOpen, setBriefOpen] = useState(false)

  const start = () => {
    if (!live || live.residentId !== resident.id) startConference(resident.id)
    navigate(`/resident/${resident.id}/conference`)
  }

  return (
    <div className="rounded-lg border bg-paper-raised shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-paper px-4 py-2.5">
        <span className="text-sm font-medium text-spruce">Commitments &amp; history</span>
        <div className="flex gap-2">
          <button
            onClick={() => setBriefOpen(true)}
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-spruce hover:bg-paper-sunken"
          >
            Generate pre-meeting brief
          </button>
          <button
            onClick={start}
            className="rounded-md bg-spruce px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Start conference →
          </button>
        </div>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ActionItems residentId={resident.id} />
        </div>
        <DecisionLog residentId={resident.id} />
        <NotificationLog residentId={resident.id} />
      </div>

      {briefOpen && (
        <PreMeetingBriefModal
          resident={resident}
          assessment={assessment}
          actionItems={actionItems}
          questions={questions}
          onClose={() => setBriefOpen(false)}
          onStart={start}
        />
      )}
    </div>
  )
}
