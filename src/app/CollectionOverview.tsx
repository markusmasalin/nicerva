import type { Wine } from '../features/wines'
import { COLORS } from '../shared/colors'

type Props = {
  wines: Wine[]
  bottleCounts: Record<string, number>
}

export function CollectionOverview({ wines, bottleCounts }: Props) {
  const totals = new Map<string, number>()
  for (const wine of wines) {
    const count = bottleCounts[wine.id] ?? 0
    if (count <= 0) continue
    totals.set(wine.country, (totals.get(wine.country) ?? 0) + count)
  }

  const countries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])

  if (countries.length === 0) {
    return null
  }

  return (
    <div style={{ borderBottom: `0.5px solid ${COLORS.line}`, marginBottom: '32px' }}>
      {countries.map(([country, total]) => (
        <div
          key={country}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '15px',
            fontWeight: 500,
            padding: '6px 0',
          }}
        >
          <span style={{ color: COLORS.text }}>{country}</span>
          <span style={{ color: COLORS.textMuted }}>{total} pulloa</span>
        </div>
      ))}
    </div>
  )
}
