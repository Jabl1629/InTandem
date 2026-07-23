/** InTandem wordmark. The mark is two interlocking links — "in tandem". */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect
        x="3.2"
        y="10.5"
        width="16"
        height="11"
        rx="5.5"
        stroke="var(--spruce)"
        strokeWidth="2.4"
      />
      <rect
        x="12.8"
        y="10.5"
        width="16"
        height="11"
        rx="5.5"
        stroke="var(--glacier)"
        strokeWidth="2.4"
      />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-none">
        <div className="font-display text-[19px] font-semibold tracking-tight text-spruce">
          InTandem
        </div>
        {!compact && (
          <div className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-slate-soft">
            by GoSteady
          </div>
        )}
      </div>
    </div>
  )
}
