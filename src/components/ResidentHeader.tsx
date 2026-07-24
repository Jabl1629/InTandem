import { useNavigate } from 'react-router-dom'
import type { Resident } from '@/types'
import type { ResidentAssessment } from '@/domain/assess'
import { CARE_LEVEL_LABEL } from '@/lib/status'
import { daysUntil, formatLong } from '@/lib/dates'
import { Avatar } from './Avatar'
import { CareLevelBadge } from './ui'

function DateStat({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="text-right">
      <div className="text-[11px] uppercase tracking-wide text-slate-soft">{label}</div>
      <div className={`text-sm font-medium ${urgent ? 'text-watch-ink' : 'text-spruce'}`}>{value}</div>
    </div>
  )
}

export function ResidentHeader({ resident, assessment }: { resident: Resident; assessment: ResidentAssessment }) {
  const navigate = useNavigate()
  const nextDays = daysUntil(resident.nextConferenceDate)

  return (
    <div className="rounded-lg border bg-paper-raised shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={resident.name} size={60} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold text-spruce">{resident.name}</h1>
              <CareLevelBadge level={resident.careLevel} />
            </div>
            <div className="mt-1 text-sm text-slate">
              Age {resident.age} · Room {resident.room} · {CARE_LEVEL_LABEL[resident.careLevel]} · Admitted{' '}
              {formatLong(resident.admitDate)}
            </div>
            <div className="mt-0.5 text-sm text-slate">
              Primary contact:{' '}
              <span className="font-medium text-spruce">{resident.primaryContact.name}</span> (
              {resident.primaryContact.relationship}) · {resident.primaryContact.phone}
            </div>
          </div>
        </div>
        <div className="flex gap-6">
          <DateStat label="Last conference" value={formatLong(resident.lastConferenceDate)} />
          <DateStat
            label="Next conference"
            value={`${formatLong(resident.nextConferenceDate)} · in ${nextDays}d`}
            urgent={nextDays <= 7}
          />
        </div>
      </div>

      {assessment.significant.triggered && (
        <div className="flex flex-wrap items-center gap-3 border-t border-l-4 border-l-alert bg-alert-wash px-5 py-3">
          <span className="text-alert" aria-hidden>
            ⚠
          </span>
          <span className="text-sm text-spruce">
            <span className="font-semibold">Significant change detected</span> — {assessment.significant.reason}.
            The sensors are proposing an off-cycle conference.
          </span>
          <button
            onClick={() => navigate(`/huddle/resident/${resident.id}/conference`)}
            className="ml-auto rounded-md bg-alert px-3.5 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Schedule significant-change conference →
          </button>
        </div>
      )}
    </div>
  )
}
