import type { ReactNode } from 'react'
import type { CareLevel, DomainStatus, StaffMember } from '@/types'
import { CARE_LEVEL_LABEL, STATUS_LABEL, statusClasses } from '@/lib/status'
import { initialsOf } from '@/lib/format'

export function Chip({
  children,
  className = '',
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}

export function CareLevelBadge({ level }: { level: CareLevel }) {
  return (
    <Chip className="bg-paper-sunken text-slate" title={CARE_LEVEL_LABEL[level]}>
      {level}
    </Chip>
  )
}

export function StatusChip({ status, children }: { status: DomainStatus; children?: ReactNode }) {
  const c = statusClasses(status)
  return (
    <Chip className={c.chip}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {children ?? STATUS_LABEL[status]}
    </Chip>
  )
}

/** The trust marker — glacier accent, used on family-visible elements (spec §3, §8). */
export function FamiliesSeeThis({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-glacier-wash px-2 py-0.5 text-[11px] font-medium text-glacier-ink ${className}`}
      title="This is visible to the resident's family — the same data, in plain language."
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M1.5 8S3.7 3.5 8 3.5 14.5 8 14.5 8 12.3 12.5 8 12.5 1.5 8 1.5 8Z" />
        <circle cx="8" cy="8" r="1.9" />
      </svg>
      Families see this
    </span>
  )
}

/** Owner attribution — a named person + role chip (spec §4.2 "owner"). */
export function OwnerChip({ staff }: { staff: StaffMember }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-sunken py-0.5 pl-0.5 pr-2 text-xs">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-spruce text-[9px] font-semibold text-white">
        {initialsOf(staff.name)}
      </span>
      <span className="font-medium text-spruce">{staff.name}</span>
      <span className="text-slate-soft">{staff.role}</span>
    </span>
  )
}

export function Card({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <Tag className={`rounded-lg border bg-paper-raised shadow-card ${className}`}>{children}</Tag>
  )
}
