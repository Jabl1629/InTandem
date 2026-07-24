import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { DomainId } from '@/types'
import { useStore } from '@/store/useStore'
import { assessmentFor, getResident, goalsFor, manualStatesFor } from '@/store/selectors'
import { SENSOR_DOMAIN_IDS } from '@/data/domains'
import { ResidentHeader } from '@/components/ResidentHeader'
import { SensorCard } from '@/components/SensorCard'
import { ManualStrip } from '@/components/ManualStrip'
import { DomainDrawer } from '@/components/DomainDrawer'
import { PlanZone } from '@/components/PlanZone'
import { CommitmentsZone } from '@/components/CommitmentsZone'

function ZoneHeading({ letter, title, note }: { letter: string; title: string; note: string }) {
  return (
    <div className="mb-3 mt-8 flex items-baseline gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-spruce text-xs font-semibold text-white">
        {letter}
      </span>
      <h2 className="font-display text-lg font-semibold text-spruce">{title}</h2>
      <span className="text-xs text-slate-soft">{note}</span>
    </div>
  )
}

export function ResidentConference() {
  const { id } = useParams()
  const actionItems = useStore((s) => s.actionItems)
  const resident = id ? getResident(id) : undefined
  const assessment = useMemo(() => (id ? assessmentFor(id, actionItems) : null), [id, actionItems])
  const goals = useMemo(() => (id ? goalsFor(id) : []), [id])
  const manualStates = useMemo(() => (id ? manualStatesFor(id) : []), [id])
  const [openDomain, setOpenDomain] = useState<DomainId | null>(null)

  if (!resident || !assessment) return <div className="p-8 text-slate">Resident not found.</div>

  const goalByDomain = new Map(goals.map((g) => [g.domainId, g]))
  const openDa = openDomain ? assessment.sensor[openDomain] : undefined

  return (
    <div className="mx-auto max-w-shell px-7 py-6">
      <Link to="/huddle" className="mb-3 inline-flex items-center gap-1 text-sm text-slate hover:text-spruce">
        ← Rounding Board
      </Link>

      <ResidentHeader resident={resident} assessment={assessment} />

      {/* Zone A — Status */}
      <ZoneHeading letter="A" title="Status" note="The objective record · since last conference is the hero metric" />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {SENSOR_DOMAIN_IDS.map((did) => {
          const da = assessment.sensor[did]
          if (!da) return null
          return (
            <SensorCard
              key={did}
              da={da}
              lastConferenceDate={resident.lastConferenceDate}
              goal={goalByDomain.get(did)}
              onOpen={() => setOpenDomain(did)}
            />
          )
        })}
      </div>

      <div className="mt-3.5">
        <ManualStrip states={manualStates} />
      </div>

      {/* Zone B — The Plan */}
      <ZoneHeading letter="B" title="The Plan" note="Single source of truth · families see this" />
      <PlanZone goals={goals} assessment={assessment} />

      {/* Zone C — Commitments & history */}
      <ZoneHeading letter="C" title="Commitments & history" note="Tracked owners, due dates, and notifications" />
      <div className="mb-8">
        <CommitmentsZone resident={resident} assessment={assessment} />
      </div>

      {openDa && (
        <DomainDrawer
          da={openDa}
          lastConferenceDate={resident.lastConferenceDate}
          goal={goalByDomain.get(openDa.domainId)}
          onClose={() => setOpenDomain(null)}
        />
      )}
    </div>
  )
}
