import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { getResident } from '@/store/selectors'
import { formatLong, formatWeekday } from '@/lib/dates'
import { LogoMark } from '@/components/Logo'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-4">
      <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-slate">{title}</h2>
      {children}
    </section>
  )
}

export function FamilySummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const summary = useStore((s) => s.familySummaries.find((x) => x.id === id))
  const resident = summary ? getResident(summary.residentId) : undefined

  if (!summary || !resident) {
    return (
      <div className="flex h-full items-center justify-center bg-paper text-slate">
        <div className="text-center">
          <p>Summary not found.</p>
          <button onClick={() => navigate('/')} className="mt-3 text-sm text-glacier">
            ← Rounding Board
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-paper-sunken py-8">
      {/* Action bar (screen only) */}
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between px-6">
        <button
          onClick={() => navigate(`/resident/${resident.id}`)}
          className="text-sm text-slate hover:text-spruce"
        >
          ← Back to {resident.name.split(' ')[0]}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/family/${resident.id}`)}
            className="rounded-md border bg-paper-raised px-3 py-1.5 text-sm font-medium text-glacier-ink hover:bg-paper"
          >
            Preview family view
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-md bg-spruce px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Print / save PDF
          </button>
        </div>
      </div>

      {/* The one-pager */}
      <article className="print-page mx-auto max-w-3xl rounded-xl border bg-paper-raised px-10 py-8 shadow-card">
        <header className="flex items-start justify-between border-b pb-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-spruce">Care Conference Summary</h1>
            <p className="mt-1 text-slate">
              {resident.name} · Room {resident.room} · Fraser Pines
            </p>
            <p className="text-sm text-slate-soft">Prepared {formatWeekday(summary.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <LogoMark size={22} />
            <div className="leading-none">
              <div className="font-display text-base font-semibold text-spruce">InTandem</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-soft">by GoSteady</div>
            </div>
          </div>
        </header>

        <p className="py-4 text-spruce">
          Dear {resident.primaryContact.name}, here is a summary of what we reviewed in {resident.name.split(' ')[0]}’s
          care conference, in plain language. Please reach out with any questions.
        </p>

        <Section title="What we reviewed">
          <ul className="list-disc space-y-1 pl-5 text-spruce">
            {summary.reviewed.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Section>

        {summary.changed.length > 0 && (
          <Section title="What changed since the last conference">
            <ul className="list-disc space-y-1 pl-5 text-spruce">
              {summary.changed.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Section>
        )}

        {summary.decisions.length > 0 && (
          <Section title="What we decided">
            <ul className="list-disc space-y-1 pl-5 text-spruce">
              {summary.decisions.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </Section>
        )}

        {summary.actionItems.length > 0 && (
          <Section title="Who is doing what, by when">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-soft">
                  <th className="pb-1 font-semibold">What</th>
                  <th className="pb-1 font-semibold">Who</th>
                  <th className="pb-1 font-semibold">By when</th>
                </tr>
              </thead>
              <tbody>
                {summary.actionItems.map((a, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1.5 pr-3 text-spruce">{a.description}</td>
                    <td className="py-1.5 pr-3 text-slate">{a.owner}</td>
                    <td className="py-1.5 text-slate">{formatLong(a.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {summary.questionsAnswered.length > 0 && (
          <Section title="Your questions & our answers">
            <div className="space-y-3">
              {summary.questionsAnswered.map((q, i) => (
                <div key={i}>
                  <p className="font-medium text-spruce">Q: {q.question}</p>
                  <p className="text-slate">A: {q.answer}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Next conference">
          <p className="text-spruce">{formatLong(summary.nextConferenceDate)}</p>
        </Section>

        <footer className="mt-2 border-t pt-4 text-xs text-slate-soft">
          All resident data in this prototype is fictional. InTandem is a general-wellness tool — not a medical device;
          no diagnostic claims.
        </footer>
      </article>
    </div>
  )
}
