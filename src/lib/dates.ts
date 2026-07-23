/**
 * Date helpers with a PINNED demo "today". Using the real clock would make
 * the seeded 90-day series and every "days until / days ago" drift daily and
 * break the authored narrative (overdue-by-6-days, etc.). Everything in the
 * prototype references DEMO_TODAY.
 */

// Monday — "This is Monday morning" in the demo script (spec §10).
export const DEMO_TODAY = new Date('2026-07-20T09:00:00')

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const TODAY_ISO = isoDate(DEMO_TODAY)

export function parseISO(s: string): Date {
  // Interpret as local midnight to avoid TZ surprises in day math.
  const [y, m, d] = s.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** ISO date n days before the demo today (n>0 = past). */
export function daysAgoISO(n: number): string {
  return isoDate(addDays(DEMO_TODAY, -n))
}

/** ISO date n days after the demo today. */
export function daysFromNowISO(n: number): string {
  return isoDate(addDays(DEMO_TODAY, n))
}

/** whole days from a → b (b - a). Positive when b is later. */
export function diffDays(a: string | Date, b: string | Date): number {
  const da = typeof a === 'string' ? parseISO(a) : a
  const db = typeof b === 'string' ? parseISO(b) : b
  return Math.round((startOfDay(db).getTime() - startOfDay(da).getTime()) / MS_PER_DAY)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** days from a date until demo-today (positive = in the past). */
export function daysSince(iso: string): number {
  return diffDays(iso, DEMO_TODAY)
}

/** days from demo-today until a date (positive = in the future). */
export function daysUntil(iso: string): number {
  return diffDays(DEMO_TODAY, iso)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "May 14" */
export function formatShort(iso: string): string {
  const d = parseISO(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** "May 14, 2026" */
export function formatLong(iso: string): string {
  const d = parseISO(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/** "Mon, May 14" */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function formatWeekday(iso: string): string {
  const d = parseISO(iso)
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** Human relative phrase for due dates: "6 days overdue", "in 3 days", "today". */
export function relativeDue(iso: string): string {
  const n = daysUntil(iso)
  if (n === 0) return 'due today'
  if (n < 0) return `${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'} overdue`
  return `due in ${n} day${n === 1 ? '' : 's'}`
}
