import { useWines } from '../features/wines'
import type { Wine, WineFilterParams } from '../features/wines'
import { useBottleCounts, useAveragePrices } from '../features/inventory'
import { COLORS } from '../shared/colors'
import { COUNTRY_FLAG_COLORS } from '../shared/countryFlagColors'

const WINE_TYPE_COLORS: Record<string, string> = {
  red: '#6E4247',
  white: '#D9D3C4',
  rose: '#C98F8F',
  sparkling: '#B8B8A8',
  dessert: '#A8823D',
  fortified: '#7A4B3A',
}

type NameProducerGroup = {
  key: string
  name: string
  producer: string
  appellation: string | null
  grapes: string[]
  type: string
  wines: Wine[]
}

type RegionGroup = {
  region: string
  totalBottles: number
  nameGroups: NameProducerGroup[]
}

type CountryGroup = {
  country: string
  totalBottles: number
  regions: RegionGroup[]
}

function buildCountryGroups(wines: Wine[], bottleCounts: Record<string, number>): CountryGroup[] {
  const countryMap = new Map<string, Map<string, Map<string, NameProducerGroup>>>()

  for (const wine of wines) {
    const count = bottleCounts[wine.id]
    if (!count) continue

    if (!countryMap.has(wine.country)) countryMap.set(wine.country, new Map())
    const regionMap = countryMap.get(wine.country)!

    if (!regionMap.has(wine.region)) regionMap.set(wine.region, new Map())
    const nameMap = regionMap.get(wine.region)!

    const key = `${wine.name.trim().toLowerCase()}|${wine.producer.trim().toLowerCase()}`
    if (!nameMap.has(key)) {
      nameMap.set(key, {
        key,
        name: wine.name,
        producer: wine.producer,
        appellation: wine.appellation,
        grapes: wine.grapes,
        type: wine.type,
        wines: [],
      })
    }
    nameMap.get(key)!.wines.push(wine)
  }

  const countries: CountryGroup[] = []
  for (const [country, regionMap] of countryMap) {
    const regions: RegionGroup[] = []
    for (const [region, nameMap] of regionMap) {
      const nameGroups = Array.from(nameMap.values())
        .map((group) => ({
          ...group,
          wines: [...group.wines].sort((a, b) => (b.vintage ?? -Infinity) - (a.vintage ?? -Infinity)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name) || a.producer.localeCompare(b.producer))
      const totalBottles = nameGroups.reduce(
        (sum, group) => sum + group.wines.reduce((s, w) => s + (bottleCounts[w.id] ?? 0), 0),
        0,
      )
      regions.push({ region, totalBottles, nameGroups })
    }
    regions.sort((a, b) => b.totalBottles - a.totalBottles)
    const totalBottles = regions.reduce((sum, r) => sum + r.totalBottles, 0)
    countries.push({ country, totalBottles, regions })
  }
  countries.sort((a, b) => b.totalBottles - a.totalBottles)
  return countries
}

function BottleIcon() {
  return (
    <svg width="9" height="18" viewBox="0 0 10 20" style={{ display: 'block' }}>
      <rect x="3" y="0" width="4" height="5" rx="1" fill="currentColor" />
      <rect x="0" y="5" width="10" height="15" rx="2" fill="currentColor" />
    </svg>
  )
}

type NameGroupRowProps = {
  group: NameProducerGroup
  bottleCounts: Record<string, number>
  averagePrices: Record<string, number>
  onOpenWine: (identity: { name: string; producer: string }) => void
}

function NameGroupRow({ group, bottleCounts, averagePrices, onOpenWine }: NameGroupRowProps) {
  const subtitle = group.appellation || (group.grapes.length > 0 ? group.grapes.join(', ') : group.type)

  const groupTotalBottles = group.wines.reduce((sum, wine) => sum + (bottleCounts[wine.id] ?? 0), 0)
  let pricedWeightedSum = 0
  let pricedWeightedCount = 0
  for (const wine of group.wines) {
    const avg = averagePrices[wine.id]
    if (avg == null) continue
    const count = bottleCounts[wine.id] ?? 0
    pricedWeightedSum += avg * count
    pricedWeightedCount += count
  }
  const averagePrice = pricedWeightedCount > 0 ? pricedWeightedSum / pricedWeightedCount : null

  return (
    <div style={{ marginBottom: '16px' }}>
      <div>
        <span style={{ color: COLORS.text }}>{group.name}</span>{' '}
        <span style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>{group.producer}</span>
      </div>
      {subtitle && (
        <div style={{ color: COLORS.textMuted, fontSize: '0.8rem', marginBottom: '4px' }}>{subtitle}</div>
      )}
      {averagePrice != null && (
        <div style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '4px' }}>
          {groupTotalBottles} pulloa · keskihinta {Math.round(averagePrice)} €
        </div>
      )}
      {group.wines.map((wine) => {
        const count = bottleCounts[wine.id] ?? 0
        const bottleColor = WINE_TYPE_COLORS[wine.type] ?? COLORS.textMuted
        return (
          <div
            key={wine.id}
            onClick={() => onOpenWine({ name: group.name, producer: group.producer })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '2px 0',
            }}
          >
            <span style={{ minWidth: '2.5em', color: COLORS.text }}>{wine.vintage ?? '–'}</span>
            {count > 8 ? (
              <span style={{ color: COLORS.textMuted }}>×{count} pulloa</span>
            ) : (
              <span style={{ display: 'flex', gap: '3px', color: bottleColor }}>
                {Array.from({ length: count }).map((_, i) => (
                  <BottleIcon key={i} />
                ))}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

type CollectionViewProps = {
  filters?: WineFilterParams
  onOpenWine: (identity: { name: string; producer: string }) => void
}

export function CollectionView({ filters, onOpenWine }: CollectionViewProps) {
  const { data: wines = [], isLoading } = useWines(filters)
  const { data: bottleCounts } = useBottleCounts()
  const { data: averagePrices } = useAveragePrices()

  if (isLoading) {
    return <p>Ladataan...</p>
  }

  const counts = bottleCounts ?? {}
  const prices = averagePrices ?? {}
  const countries = buildCountryGroups(wines, counts)

  if (countries.length === 0) {
    return <p style={{ color: COLORS.textMuted }}>Ei viinejä kokoelmassa.</p>
  }

  return (
    <div>
      {countries.map((country) => (
        <div
          key={country.country}
          style={{ position: 'relative', paddingLeft: '1rem', marginBottom: '32px' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '1px',
              background: COLORS.line,
            }}
          />
          <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: 600 }}>{country.country}</h2>
          {(() => {
            const flagColors = COUNTRY_FLAG_COLORS[country.country.toLowerCase().trim()]
            if (!flagColors) return null
            return (
              <div style={{ display: 'flex', height: '2px', width: '64px', marginTop: '6px', marginBottom: '12px' }}>
                {flagColors.map((color, i) => (
                  <div key={i} style={{ flex: 1, background: color }} />
                ))}
              </div>
            )
          })()}
          {country.regions.map((region) => (
            <div key={region.region} style={{ marginBottom: '36px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  marginBottom: '28px',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500, color: COLORS.text }}>{region.region}</span>
                <span style={{ fontSize: '13px', color: COLORS.textMuted }}>{region.totalBottles} pulloa</span>
              </div>
              {region.nameGroups.map((group) => (
                <NameGroupRow
                  key={group.key}
                  group={group}
                  bottleCounts={counts}
                  averagePrices={prices}
                  onOpenWine={onOpenWine}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
