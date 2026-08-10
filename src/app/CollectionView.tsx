import type { CSSProperties } from 'react'
import { useWines } from '../features/wines'
import type { Wine, WineFilterParams } from '../features/wines'
import { useBottleCounts, useAveragePrices } from '../features/inventory'
import { useGroupAverageRating } from '../features/tastings'
import { COLORS } from '../shared/colors'
import { COUNTRY_FLAG_COLORS } from '../shared/countryFlagColors'
import { WINE_TYPE_COLORS } from '../shared/wineTypeColors'
import { BottleIcon } from '../shared/BottleIcon'
import { useTranslation, useLanguage } from './LanguageContext'
import type { LanguageCode } from '../shared/countries'
import type { GroupLevel, GroupingMode, GroupContext } from '../shared/groupingModes'

type NameProducerGroup = {
  key: string
  name: string
  producer: string
  appellation: string | null
  grapes: string[]
  type: string
  wines: Wine[]
}

// Rekursiivisen ryhmittelypuun yksi solmu. nameGroups on ei-null vain
// lehtitasolla (kun GroupLevel[] on käyty loppuun) — silloin renderöidään
// nykyinen NameGroupBlock/VintageColumn-hyllynäkymä. Muuten children
// sisältää seuraavan tason alisolmut.
type GroupNode = {
  key: string
  label: string
  totalBottles: number
  nameGroups: NameProducerGroup[] | null
  children: GroupNode[]
}

function buildNameGroups(wines: Wine[], bottleCounts: Record<string, number>): NameProducerGroup[] {
  const nameMap = new Map<string, NameProducerGroup>()

  for (const wine of wines) {
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

  return Array.from(nameMap.values())
    .map((group) => ({
      ...group,
      wines: [...group.wines].sort((a, b) => (b.vintage ?? -Infinity) - (a.vintage ?? -Infinity)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.producer.localeCompare(b.producer))
}

function buildGroups(
  wines: Wine[],
  bottleCounts: Record<string, number>,
  levels: GroupLevel[],
  language: LanguageCode,
  context: GroupContext,
): GroupNode[] {
  const [level, ...rest] = levels
  const buckets = new Map<string, Wine[]>()

  for (const wine of wines) {
    if (!bottleCounts[wine.id]) continue
    const key = level.key(wine, context)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(wine)
  }

  const nodes: GroupNode[] = []
  for (const [key, groupWines] of buckets) {
    const totalBottles = groupWines.reduce((sum, wine) => sum + (bottleCounts[wine.id] ?? 0), 0)
    const isLeaf = rest.length === 0
    nodes.push({
      key,
      label: level.label(key, language),
      totalBottles,
      nameGroups: isLeaf ? buildNameGroups(groupWines, bottleCounts) : null,
      children: isLeaf ? [] : buildGroups(groupWines, bottleCounts, rest, language, context),
    })
  }
  nodes.sort((a, b) => b.totalBottles - a.totalBottles)
  return nodes
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
  viewMode: GroupingMode
  bottleCounts: Record<string, number>
  averagePrices: Record<string, number>
  truncateName: boolean
  onOpenWine: (identity: { name: string; producer: string }) => void
}

// Rivejä jätetään pois kun sama tieto on jo ryhmän otsikkona (GroupBranch):
// tuottaja-tila piilottaa tuottajarivin, appellaatio-tila hyppää appellaation
// yli subtitle-varajärjestyksessä. Koskee sekä yhden että usean vuosikerran
// ryhmiä, koska molemmat käyttävät samaa otsikkolohkoa.
function NameGroupBlock({ group, viewMode, bottleCounts, averagePrices, truncateName, onOpenWine }: NameGroupBlockProps) {
  const isMultiVintage = group.wines.length > 1

  const truncateStyle: CSSProperties = truncateName
    ? { maxWidth: '140px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
    : {}

  const grapesOrType = group.grapes.length > 0 ? group.grapes.join(', ') : group.type
  const subtitle = viewMode === 'appellation' ? grapesOrType : group.appellation || grapesOrType

  return (
    <div
      onClick={() => onOpenWine({ name: group.name, producer: group.producer })}
      style={{ cursor: 'pointer', width: isMultiVintage ? '100%' : undefined, minWidth: 0 }}
    >
      <div style={{ marginBottom: '9px' }}>
        <div title={group.name} style={{ color: COLORS.text, fontSize: '16px', ...truncateStyle }}>
          {group.name}
        </div>
        {viewMode !== 'producer' && (
          <div
            title={group.producer}
            style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: '2px', ...truncateStyle }}
          >
            {group.producer}
          </div>
        )}
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

type ProducerRatingBadgeProps = {
  wineIds: string[]
}

function ProducerRatingBadge({ wineIds }: ProducerRatingBadgeProps) {
  const { data: averageRating } = useGroupAverageRating(wineIds)
  if (averageRating == null) return null
  return <span style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>⭐ {averageRating.toFixed(1)}</span>
}

type GroupBranchProps = {
  node: GroupNode
  depth: number
  viewMode: GroupingMode
  bottleCounts: Record<string, number>
  averagePrices: Record<string, number>
  onOpenWine: (identity: { name: string; producer: string }) => void
}

function GroupBranchBody({ node, depth, viewMode, bottleCounts, averagePrices, onOpenWine }: GroupBranchProps) {
  if (node.nameGroups) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '23px', rowGap: '36px' }}>
        {node.nameGroups.map((group) => (
          <NameGroupBlock
            key={group.key}
            group={group}
            viewMode={viewMode}
            bottleCounts={bottleCounts}
            averagePrices={averagePrices}
            truncateName={node.nameGroups!.length > 1}
            onOpenWine={onOpenWine}
          />
        ))}
      </div>
    )
  }
  return (
    <>
      {node.children.map((child) => (
        <GroupBranch
          key={child.key}
          node={child}
          depth={depth + 1}
          viewMode={viewMode}
          bottleCounts={bottleCounts}
          averagePrices={averagePrices}
          onOpenWine={onOpenWine}
        />
      ))}
    </>
  )
}

// Ylin taso (depth 0) saa aina samat ison otsikon + pystyviivan + mahdollisen
// lippuraidan kuin maa-taso teki — riippumatta siitä mitä se grouping-tilassa
// tarkoittaa (maa tai hintaluokka). Lippuraita näkyy vain jos key sattuu
// täsmäämään COUNTRY_FLAG_COLORS-avaimeen, joten se ei koskaan renderöidy
// price-tilassa. Syvemmät tasot (depth >= 1) käyttävät aiempaa alue-tyyliä
// (pienempi otsikko + alaviiva-erotin).
//
// ProducerRatingBadge kuuluu tuottaja-tason riville — ei maa- tai alue-
// tasolle. Tuottaja on aina se GroupNode, jolla on nameGroups (lehtitaso),
// joten tunnistus ei riipu syvyydestä: producer-tilassa vain tuottajataso on
// lehti, maa/alue-tasoilla nameGroups on null.
function GroupBranch(props: GroupBranchProps) {
  const { node, depth, viewMode } = props
  const t = useTranslation()

  const wineIds = node.nameGroups ? node.nameGroups.flatMap((group) => group.wines.map((wine) => wine.id)) : []
  const showProducerBadge = viewMode === 'producer' && node.nameGroups != null

  if (depth === 0) {
    const flagColors = COUNTRY_FLAG_COLORS[node.key]

    return (
      <div style={{ position: 'relative', paddingLeft: '1rem', marginBottom: '37px' }}>
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: flagColors ? '7px' : '14px' }}>
          <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 600 }}>{node.label}</h2>
          <span style={{ fontSize: '14px', color: COLORS.textMuted }}>
            {node.totalBottles} {t('collection_bottles_suffix')}
          </span>
          {showProducerBadge && <ProducerRatingBadge wineIds={wineIds} />}
        </div>
        {flagColors && (
          <div style={{ display: 'flex', height: '2px', width: '64px', marginBottom: '14px' }}>
            {flagColors.map((color, i) => (
              <div key={i} style={{ flex: 1, background: color }} />
            ))}
          </div>
        )}
        <GroupBranchBody {...props} />
      </div>
    )
  }

  return (
    <div
      style={{
        marginBottom: '28px',
        paddingBottom: '19px',
        borderBottom: `1.5px solid ${COLORS.line}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '32px' }}>
        <span style={{ fontSize: '17px', fontWeight: 500, color: COLORS.text }}>{node.label}</span>
        <span style={{ fontSize: '14px', color: COLORS.textMuted }}>
          {node.totalBottles} {t('collection_bottles_suffix')}
        </span>
        {showProducerBadge && <ProducerRatingBadge wineIds={wineIds} />}
      </div>
      <GroupBranchBody {...props} />
    </div>
  )
}

type CollectionViewProps = {
  filters?: WineFilterParams
  groupLevels: GroupLevel[]
  viewMode: GroupingMode
  onOpenWine: (identity: { name: string; producer: string }) => void
}

export function CollectionView({ filters, groupLevels, viewMode, onOpenWine }: CollectionViewProps) {
  const t = useTranslation()
  const language = useLanguage()
  const { data: wines = [], isLoading } = useWines(filters)
  const { data: bottleCounts } = useBottleCounts()
  const { data: averagePrices } = useAveragePrices()

  if (isLoading) {
    return <p>{t('common_loading')}</p>
  }

  const counts = bottleCounts ?? {}
  const prices = averagePrices ?? {}
  const context: GroupContext = { averagePrices: prices }
  const groups = buildGroups(wines, counts, groupLevels, language, context)

  if (groups.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ color: COLORS.text, fontSize: '16px', margin: '0 0 32px' }}>{t('collection_empty_title')}</p>
        <div style={{ maxWidth: '360px', margin: '0 auto', textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: COLORS.text, fontSize: '15px', margin: '0 0 4px' }}>{t('onboarding_tip_add_title')}</p>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>{t('onboarding_tip_add_body')}</p>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: COLORS.text, fontSize: '15px', margin: '0 0 4px' }}>{t('onboarding_tip_edit_title')}</p>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>{t('onboarding_tip_edit_body')}</p>
          </div>
          <div>
            <p style={{ color: COLORS.text, fontSize: '15px', margin: '0 0 4px' }}>{t('onboarding_tip_open_title')}</p>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>{t('onboarding_tip_open_body')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {groups.map((node) => (
        <GroupBranch
          key={node.key}
          node={node}
          depth={0}
          viewMode={viewMode}
          bottleCounts={counts}
          averagePrices={prices}
          onOpenWine={onOpenWine}
        />
      ))}
    </div>
  )
}
