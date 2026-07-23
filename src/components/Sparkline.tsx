import { Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { Point } from '@/domain/series'

/**
 * Sparkline with the last-conference date etched as a vertical reference line —
 * the device that carries the product's whole argument ("what changed since we
 * last met"). Used small in cards and large in the domain drawer.
 */
export function Sparkline({
  data,
  refDate,
  color,
  height = 52,
  showRefLabel = false,
}: {
  data: Point[]
  refDate?: string
  color: string
  height?: number
  showRefLabel?: boolean
}) {
  // Only draw the reference line if it falls inside the visible window.
  const refInWindow = refDate && data.some((d) => d.date === refDate)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 3, bottom: 2, left: 3 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        {refInWindow && (
          <ReferenceLine
            x={refDate}
            stroke="var(--slate-soft)"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={
              showRefLabel
                ? { value: 'last conference', position: 'insideTopLeft', fill: 'var(--slate-soft)', fontSize: 10 }
                : undefined
            }
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.75}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
