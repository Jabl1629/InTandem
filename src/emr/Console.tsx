import { Link } from 'react-router-dom'

/** Placeholder — the founder control console is built alongside the backend. */
export function Console() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#12161c] px-6 py-12 text-center text-[#e5e9f0]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6ea8dc]">
        Founder console
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Demo controls</h1>
      <p className="mt-2 max-w-md text-sm text-[#98a2b3]">
        Scenario fire buttons and call status — built with the backend.
      </p>
      <Link to="/" className="mt-5 text-sm font-medium text-[#6ea8dc] hover:underline">
        ← Back to demos
      </Link>
    </div>
  )
}
