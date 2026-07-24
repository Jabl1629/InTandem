import { useMemo } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { TODAY_ISO, formatWeekday } from '@/lib/dates'
import { useStore } from '@/store/useStore'
import { assessAll, residents } from '@/store/selectors'
import { Logo } from './Logo'
import { Avatar } from './Avatar'
import { ProvenanceLegend } from './ProvenanceIcon'
import { CareLevelBadge } from './ui'
import { statusClasses } from '@/lib/status'

function RailResident({ id, name, careLevel, dot }: { id: string; name: string; careLevel: string; dot: string }) {
  return (
    <NavLink
      to={`/huddle/resident/${id}`}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
          isActive ? 'bg-paper-sunken text-spruce' : 'text-slate hover:bg-paper-sunken/60 hover:text-spruce'
        }`
      }
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="truncate">{name}</span>
      <span className="ml-auto text-[10px] font-medium text-slate-soft">{careLevel}</span>
    </NavLink>
  )
}

function ViewAsToggle() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const onFamily = location.pathname.startsWith('/huddle/family/')
  const residentId = params.id

  const go = (family: boolean) => {
    if (!residentId) return
    navigate(family ? `/huddle/family/${residentId}` : `/huddle/resident/${residentId}`)
  }

  return (
    <div className="inline-flex items-center rounded-full border bg-paper p-0.5 text-xs font-medium">
      <button
        onClick={() => go(false)}
        disabled={!residentId}
        className={`rounded-full px-3 py-1 transition-colors ${
          !onFamily ? 'bg-spruce text-white' : 'text-slate disabled:opacity-40'
        }`}
      >
        Staff
      </button>
      <button
        onClick={() => go(true)}
        disabled={!residentId}
        className={`rounded-full px-3 py-1 transition-colors ${
          onFamily ? 'bg-glacier text-white' : 'text-slate disabled:opacity-40'
        }`}
      >
        Family
      </button>
    </div>
  )
}

export function AppShell() {
  const actionItems = useStore((s) => s.actionItems)
  const resetDemo = useStore((s) => s.resetDemo)
  const assessments = useMemo(() => assessAll(actionItems), [actionItems])

  const ranked = useMemo(
    () =>
      [...residents].sort(
        (a, b) => (assessments[b.id]?.changeScore.score ?? 0) - (assessments[a.id]?.changeScore.score ?? 0),
      ),
    [assessments],
  )

  const onReset = () => {
    resetDemo()
    // Full reload at the Huddle home (base-aware for GitHub Pages) → clean slate.
    window.location.href = `${import.meta.env.BASE_URL}#/huddle`
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left rail — hidden on small screens (Family View is phone-first) */}
      <aside className="hidden w-[252px] shrink-0 flex-col border-r bg-paper no-print lg:flex">
        <div className="px-5 py-5">
          <NavLink to="/">
            <Logo />
          </NavLink>
        </div>

        <nav className="flex-1 overflow-y-auto scroll-quiet px-3">
          <NavLink
            to="/huddle"
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-spruce text-white' : 'text-slate hover:bg-paper-sunken hover:text-spruce'
              }`
            }
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2.5" width="12" height="3" rx="1" />
              <rect x="2" y="7" width="12" height="3" rx="1" />
              <rect x="2" y="11.5" width="12" height="2.5" rx="1" />
            </svg>
            Rounding Board
          </NavLink>

          <div className="mb-1 mt-5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-soft">
            Residents
          </div>
          <div className="space-y-0.5 pb-4">
            {ranked.map((r) => {
              const a = assessments[r.id]
              const status = a && a.alertCount > 0 ? 'alert' : a && a.watchCount > 0 ? 'watch' : 'stable'
              return (
                <RailResident
                  key={r.id}
                  id={r.id}
                  name={r.name}
                  careLevel={r.careLevel}
                  dot={statusClasses(status).dot}
                />
              )
            })}
          </div>
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-paper/80 px-5 no-print sm:px-7">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg font-semibold text-spruce">Fraser Pines</span>
            <span className="hidden text-xs text-slate-soft sm:inline">Life Plan Community · Boulder, CO</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden text-sm text-slate sm:inline">{formatWeekday(TODAY_ISO)}</span>
            <ViewAsToggle />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto scroll-quiet">
          <Outlet />
        </main>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-paper px-7 py-2.5 text-xs no-print">
          <span className="text-slate-soft">
            All resident data is fictional. InTandem is a prototype — not a medical device; no diagnostic
            claims.
          </span>
          <div className="flex items-center gap-5">
            <ProvenanceLegend />
            <button
              onClick={onReset}
              className="rounded-md border px-2.5 py-1 font-medium text-slate transition-colors hover:bg-paper-sunken hover:text-spruce"
            >
              Reset demo data
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
