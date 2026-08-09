import type { CSSProperties } from 'react'
import { useWines } from '../features/wines'
import type { Wine, WineFilterParams } from '../features/wines'
import { useBottleCounts, useAveragePrices } from '../features/inventory'
import { COLORS } from '../shared/colors'
import { COUNTRY_FLAG_COLORS } from '../shared/countryFlagColors'
import { WINE_TYPE_COLORS } from '../shared/wineTypeColors'
import { BottleIcon } from '../shared/BottleIcon'
import { useTranslation } from './LanguageContext'

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

type VintageColumnProps = {
  wine: Wine
  bottleCounts: Record<string, number>
  averagePrices: Record<string, number>
}

function VintageColumn({ wine, bottleCounts, averagePrices }: VintageColumnProps) {
  const count = bottleCounts[wine.id] ?? 0
  const bottleColor = WINE_TYPE_COLORS[wine.type] ?? COLORS.textMuted
  const avgPrice = averagePrices[wine.id]

  return (
    <div style={{ width: '56px' }}>
      {count >= 3 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: bottleColor, fontSize: '15px' }}>
          <BottleIcon />
          <span>×{count}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', color: bottleColor }}>
          {Array.from({ length: count }).map((_, i) => (
            <BottleIcon key={i} />
          ))}
        </div>
      )}
      <div style={{ fontSize: '13px', color: COLORS.textVintage }}>{wine.vintage ?? '–'}</div>
      {avgPrice != null && (
        <div style={{ fontSize: '13px', color: COLORS.textPrice }}>{Math.round(avgPrice)} €</div>
      )}
    </div>
  )
}

type NameGroupBlockProps = {
  group: NameProducerGroup
  bottleCounts: Record<string, number>
  averagePrices: Record<string, number>
  truncateName: boolean
  onOpenWine: (identity: { name: string; producer: string }) => void
}

function NameGroupBlock({ group, bottleCounts, averagePrices, truncateName, onOpenWine }: NameGroupBlockProps) {
  const isMultiVintage = group.wines.length > 1

  const truncateStyle: CSSProperties = truncateName
    ? { maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
    : {}

  const subtitle = group.appellation || (group.grapes.length > 0 ? group.grapes.join(', ') : group.type)

  return (
    <div
      onClick={() => onOpenWine({ name: group.name, producer: group.producer })}
      style={{ cursor: 'pointer', width: isMultiVintage ? '100%' : undefined }}
    >
      <div style={{ marginBottom: '9px' }}>
        <div title={group.name} style={{ color: COLORS.text, fontSize: '16px', ...truncateStyle }}>
          {group.name}
        </div>
        <div
          title={group.producer}
          style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: '2px', ...truncateStyle }}
        >
          {group.producer}
        </div>
        {subtitle && (
          <div title={subtitle} style={{ color: COLORS.textMuted, fontSize: '12px', marginTop: '2px', ...truncateStyle }}>
            {subtitle}
          </div>
        )}
      </div>
      {isMultiVintage ? (
        <div style={{ display: 'flex', gap: '23px' }}>
          {group.wines.map((wine) => (
            <VintageColumn key={wine.id} wine={wine} bottleCounts={bottleCounts} averagePrices={averagePrices} />
          ))}
        </div>
      ) : (
        <VintageColumn wine={group.wines[0]} bottleCounts={bottleCounts} averagePrices={averagePrices} />
      )}
    </div>
  )
}

type CollectionViewProps = {
  filters?: WineFilterParams
  onOpenWine: (identity: { name: string; producer: string }) => void
}

export function CollectionView({ filters, onOpenWine }: CollectionViewProps) {
  const t = useTranslation()
  const { data: wines = [], isLoading } = useWines(filters)
  const { data: bottleCounts } = useBottleCounts()
  const { data: averagePrices } = useAveragePrices()

  if (isLoading) {
    return <p>{t('common_loading')}</p>
  }

  const counts = bottleCounts ?? {}
  const prices = averagePrices ?? {}
  const countries = buildCountryGroups(wines, counts)

  if (countries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ color: COLORS.text, fontSize: '16px', margin: '0 0 8px' }}>{t('collection_empty_title')}</p>
        <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>{t('collection_empty_body')}</p>
      </div>
    )
  }

  return (
    <div>
      {countries.map((country) => (
        <div
          key={country.country}
          style={{ position: 'relative', paddingLeft: '1rem', marginBottom: '37px' }}
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
          <h2 style={{ margin: '0 0 14px', fontSize: '21px', fontWeight: 600 }}>{country.country}</h2>
          {(() => {
            const flagColors = COUNTRY_FLAG_COLORS[country.country.toLowerCase().trim()]
            if (!flagColors) return null
            return (
              <div style={{ display: 'flex', height: '2px', width: '64px', marginTop: '7px', marginBottom: '14px' }}>
                {flagColors.map((color, i) => (
                  <div key={i} style={{ flex: 1, background: color }} />
                ))}
              </div>
            )
          })()}
          {country.regions.map((region) => (
            <div
              key={region.region}
              style={{
                marginBottom: '28px',
                paddingBottom: '19px',
                borderBottom: `1.5px solid ${COLORS.line}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  marginBottom: '32px',
                }}
              >
                <span style={{ fontSize: '17px', fontWeight: 500, color: COLORS.text }}>{region.region}</span>
                <span style={{ fontSize: '14px', color: COLORS.textMuted }}>
                  {region.totalBottles} {t('collection_bottles_suffix')}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '23px', rowGap: '36px' }}>
                {region.nameGroups.map((group) => (
                  <NameGroupBlock
                    key={group.key}
                    group={group}
                    bottleCounts={counts}
                    averagePrices={prices}
                    truncateName={region.nameGroups.length > 1}
                    onOpenWine={onOpenWine}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
