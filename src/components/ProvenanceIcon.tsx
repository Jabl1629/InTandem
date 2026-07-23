import type { Provenance } from '@/types'

const LABEL: Record<Provenance, string> = {
  sensor: 'Sensor',
  staff: 'Staff-observed',
  family: 'Family-reported',
}

/**
 * Three tiny consistent glyphs used identically everywhere (spec §8):
 * waveform = sensor, clipboard = staff, house = family. Provenance is a
 * product principle — render it wherever a value appears.
 */
export function ProvenanceIcon({
  provenance,
  size = 14,
  className = '',
}: {
  provenance: Provenance
  size?: number
  className?: string
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    role: 'img' as const,
    'aria-label': LABEL[provenance],
    className,
  }
  if (provenance === 'sensor') {
    return (
      <svg {...common}>
        <path d="M1 8h2l1.5-4 2.5 9 2-11 2 13 1.8-7H15" />
      </svg>
    )
  }
  if (provenance === 'staff') {
    return (
      <svg {...common}>
        <rect x="3.5" y="2.5" width="9" height="12" rx="1.4" />
        <path d="M6 2.2h4v2H6z" />
        <path d="M5.8 7.5h4.4M5.8 10h3" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M2.5 7.5 8 3l5.5 4.5" />
      <path d="M4 7v6.5h8V7" />
    </svg>
  )
}

export function ProvenanceLegend({ className = '' }: { className?: string }) {
  const items: Provenance[] = ['sensor', 'staff', 'family']
  return (
    <div className={`flex items-center gap-4 text-xs text-slate ${className}`}>
      {items.map((p) => (
        <span key={p} className="inline-flex items-center gap-1.5">
          <ProvenanceIcon provenance={p} />
          {LABEL[p]}
        </span>
      ))}
    </div>
  )
}

export { LABEL as PROVENANCE_LABEL }
