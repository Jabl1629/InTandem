import { initialsOf } from '@/lib/format'

// Muted, spruce-adjacent palette — deterministic per name. Illustrated-avatar
// stand-in with zero external image dependencies (spec §7 allows this).
const PALETTE = ['#1E3A34', '#2E6E8E', '#5C6B68', '#4C7A54', '#8A5C36', '#5E4C74']

function colorFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center rounded-full font-ui font-semibold text-white"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.38 }}
      aria-hidden
    >
      {initialsOf(name)}
    </div>
  )
}
