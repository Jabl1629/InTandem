import type { ChangeScoreResult } from '@/domain/changeScore'

/**
 * Change Score with an on-hover factor breakdown — "no opacity about how it's
 * computed" (spec §6). The number is the Rounding Board's default sort key.
 */
export function ChangeScoreBadge({ result, size = 'md' }: { result: ChangeScoreResult; size?: 'md' | 'lg' }) {
  const intensity = result.score >= 40 ? 'alert' : result.score >= 20 ? 'watch' : 'stable'
  const color =
    intensity === 'alert' ? 'text-alert' : intensity === 'watch' ? 'text-watch' : 'text-slate'

  return (
    <div className="group relative inline-flex">
      <span
        className={`tnum font-display font-semibold ${color} ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}
      >
        {result.score}
      </span>
      {result.factors.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 hidden w-64 -translate-x-1/2 rounded-lg border bg-paper-raised p-3 text-left shadow-pop group-hover:block">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-soft">
            How this is computed
          </div>
          <ul className="space-y-1">
            {result.factors.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate">{f.label}</span>
                <span className="tnum font-semibold text-spruce">+{f.points}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t pt-1.5 text-xs font-semibold">
            <span className="text-spruce">Change Score</span>
            <span className="tnum text-spruce">{result.score}</span>
          </div>
        </div>
      )}
    </div>
  )
}
