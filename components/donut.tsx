// Dependency-free SVG donut: one <circle> per slice, offset with stroke-dasharray.
export function Donut({
  data,
  colors,
  active,
  onSelect,
}: {
  data: [string, number][]
  colors: string[]
  active?: string | null
  onSelect?: (name: string) => void
}) {
  const r = 40
  const C = 2 * Math.PI * r
  const total = data.reduce((s, [, v]) => s + v, 0)
  let offset = 0

  return (
    <svg viewBox="0 0 100 100" className="donut" role="img" aria-label="Spending by category">
      <g transform="rotate(-90 50 50)">
        {data.map(([name, value], i) => {
          const dash = total ? (value / total) * C : 0
          const el = (
            <circle
              key={name}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              opacity={active && active !== name ? 0.25 : 1}
              style={{ cursor: onSelect ? "pointer" : undefined, transition: "opacity .15s" }}
              onClick={() => onSelect?.(name)}
            >
              <title>{name}</title>
            </circle>
          )
          offset += dash
          return el
        })}
      </g>
    </svg>
  )
}
