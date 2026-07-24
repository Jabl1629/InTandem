import { Link } from 'react-router-dom'

/** Placeholder — the Demo EHR chart is built in the next step. */
export function EmrDemo() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#eef1f5] px-6 py-12 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f5d86]">
        AI Family Notification
      </div>
      <h1 className="mt-1 text-2xl font-semibold text-[#1f2937]">EMR Demo</h1>
      <p className="mt-2 max-w-md text-sm text-[#5b6675]">The Demo EHR chart is being built.</p>
      <Link to="/" className="mt-5 text-sm font-medium text-[#2f5d86] hover:underline">
        ← Back to demos
      </Link>
    </div>
  )
}
