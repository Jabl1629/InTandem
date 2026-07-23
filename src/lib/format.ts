import type { Domain } from '@/types'

/** Fixed-precision number with thousands separators (tabular figures in UI). */
export function formatNumber(value: number, precision = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

export function formatValue(domain: Domain, value: number): string {
  return formatNumber(value, domain.precision)
}

/** "1,180 mL", "0.82 m/s", "82%". Unit spacing follows the domain. */
export function formatWithUnit(domain: Domain, value: number): string {
  const n = formatValue(domain, value)
  if (!domain.unit) return n
  if (domain.unit === '%') return `${n}%`
  if (domain.unit.startsWith('/')) return `${n}${domain.unit}`
  return `${n} ${domain.unit}`
}

export function deltaArrow(direction: 'up' | 'down' | 'flat'): string {
  return direction === 'up' ? '▲' : direction === 'down' ? '▼' : '▬'
}

/** "7.2%" — always positive magnitude; direction carried by the arrow. */
export function formatDeltaPct(pct: number): string {
  return `${Math.abs(pct).toFixed(1)}%`
}

export function formatDeltaAbs(domain: Domain, absolute: number): string {
  const mag = Math.abs(absolute)
  const n = formatNumber(mag, domain.precision)
  if (!domain.unit || domain.unit === '%') return domain.unit === '%' ? `${n} pts` : n
  if (domain.unit.startsWith('/')) return n
  return `${n} ${domain.unit}`
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
