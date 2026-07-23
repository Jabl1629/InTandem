import { useEffect } from 'react'
import type { ActionItem, FamilyQuestion, Resident } from '@/types'
import type { ResidentAssessment } from '@/domain/assess'
import { DOMAINS } from '@/data/domains'
import { isOverdue } from '@/domain/assess'
import { buildAgenda } from '@/lib/agenda'
import { formatLong, formatShort, relativeDue } from '@/lib/dates'
import { deltaArrow, formatDeltaPct } from '@/lib/format'
import { toneTextClass, deltaTone } from '@/lib/status'
import { SENSOR_DOMAIN_IDS } from '@/data/domains'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-soft">{title}</div>
      {children}
    </div>
  )
}

export function PreMeetingBriefModal({
  resident,
  assessment,
  actionItems,
  questions,
  onClose,
  onStart,
}: {
  resident: Resident
  assessment: ResidentAssessment
  actionItems: ActionItem[]
  questions: FamilyQuestion[]
  onClose: () => void
  onStart: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const changed = SENSOR_DOMAIN_IDS.map((id) => assessment.sensor[id]).filter(
    (da) => da && da.delta && da.delta.direction !== 'flat',
  )
  const openItems = actionItems.filter((a) => a.status !== 'done')
  const pendingQs = questions.filter((q) => !q.answer)
  const agenda = buildAgenda(assessment, actionItems, questions)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-spruce/25 animate-fadein" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-paper-raised shadow-pop animate-settle">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-spruce">Pre-meeting brief</h2>
            <p className="text-sm text-slate">
              {resident.name} · prepared for the conference on {formatLong(resident.nextConferenceDate)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate hover:bg-paper-sunken" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto scroll-quiet px-6 py-4">
          <Section title={`What changed since ${formatShort(resident.lastConferenceDate)}`}>
            <ul className="space-y-1">
              {changed.map((da) => {
                const domain = DOMAINS[da!.domainId]
                const tone = deltaTone(da!.status.status, da!.delta)
                return (
                  <li key={da!.domainId} className="flex items-center justify-between text-sm">
                    <span className="text-spruce">{domain.label}</span>
                    <span className={`tnum font-medium ${toneTextClass(tone)}`}>
                      {deltaArrow(da!.delta!.direction)} {formatDeltaPct(da!.delta!.pct)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Section>

          <Section title={`Open & overdue commitments (${openItems.length})`}>
            {openItems.length ? (
              <ul className="space-y-1">
                {openItems.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-spruce">{a.description}</span>
                    <span className={isOverdue(a) ? 'text-alert' : 'text-slate'}>
                      {a.owner.name} · {relativeDue(a.dueDate)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-soft">All commitments complete.</p>
            )}
          </Section>

          {pendingQs.length > 0 && (
            <Section title={`Family questions (${pendingQs.length})`}>
              <ul className="space-y-1.5">
                {pendingQs.map((q) => (
                  <li key={q.id} className="rounded-md bg-glacier-wash px-3 py-2 text-sm text-spruce">
                    “{q.question}” <span className="text-glacier-ink">— {q.askedBy}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={`Suggested agenda (${agenda.length} items)`}>
            <ol className="space-y-1">
              {agenda.map((item, i) => (
                <li key={item.id} className="flex gap-2 text-sm">
                  <span className="tnum text-slate-soft">{i + 1}.</span>
                  <span className="text-spruce">{item.title}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-paper px-6 py-3">
          <span className="text-xs text-slate-soft">Five minutes of prep, done.</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate hover:bg-paper-sunken">
              Close
            </button>
            <button
              onClick={onStart}
              className="rounded-md bg-spruce px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Start conference →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
