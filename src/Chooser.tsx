import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'

function DemoCard({
  to,
  badge,
  title,
  blurb,
  cta,
  accent,
  icon,
}: {
  to: string
  badge: string
  title: string
  blurb: string
  cta: string
  accent: string
  icon: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="group flex flex-1 flex-col rounded-2xl border bg-paper-raised p-7 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-raised"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <div
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-white"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: accent }}>
        {badge}
      </div>
      <h2 className="mt-1 font-display text-2xl font-semibold text-spruce">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{blurb}</p>
      <span
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold transition-transform group-hover:translate-x-0.5"
        style={{ color: accent }}
      >
        {cta} →
      </span>
    </Link>
  )
}

export function Chooser() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <p className="mt-4 font-display text-xl text-spruce">Demo suite</p>
          <p className="mt-1 text-sm text-slate">Two prototypes. Pick one.</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <DemoCard
            to="/emr"
            accent="#2f5d86"
            badge="AI Family Notification"
            title="EMR Demo"
            blurb="A med change is saved in the chart → the family's phone rings with a recorded AI call → the progress note writes itself back. The compliance work that currently costs nurses 15 minutes, done in one."
            cta="Open EMR Demo"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 3.5h8l4 4v13a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
                <path d="M14 3.5V8h4" />
                <path d="M9 13.5a5 5 0 0 0 5 5" />
                <circle cx="9" cy="13.5" r="0.6" fill="currentColor" />
                <circle cx="14" cy="18.5" r="0.6" fill="currentColor" />
              </svg>
            }
          />
          <DemoCard
            to="/huddle"
            accent="#1e3a34"
            badge="Care Conference Dashboard"
            title="Huddle Dashboard Demo"
            blurb="One objective record across the rounding board, the resident conference, and the family view — built around what changed since the last conference, with commitments families can actually see."
            cta="Open Huddle Dashboard"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="4" width="17" height="4" rx="1" />
                <rect x="3.5" y="10.5" width="17" height="4" rx="1" />
                <rect x="3.5" y="17" width="11" height="3.5" rx="1" />
              </svg>
            }
          />
        </div>

        <p className="mt-8 text-center text-xs text-slate-soft">
          Prototypes · all data is fictional · not a medical device · GoSteady LLC
        </p>
      </div>
    </div>
  )
}
