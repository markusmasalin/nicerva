import { useState, type CSSProperties } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useWines, useDeleteWine } from '../features/wines'
import type { Wine } from '../features/wines'
import { BottleManager, useBottleCounts, useAveragePrices } from '../features/inventory'
import {
  useAverageRatingsByWine,
  useGroupAverageRating,
  useTastingsForWine,
  useDeleteTasting,
} from '../features/tastings'
import { COLORS } from '../shared/colors'
import { WINE_TYPE_COLORS } from '../shared/wineTypeColors'
import { BottleIcon } from '../shared/BottleIcon'
import { getBottleShape } from '../shared/bottleShapes'
import { WineIdentityModal } from './WineIdentityModal'
import { VintageModal } from './VintageModal'
import { BottleEditModal } from './BottleEditModal'
import { useTranslation } from './LanguageContext'

type Identity = {
  name: string
  producer: string
}

type Props = {
  identity: Identity
  onClose: () => void
}

const linkStyle: CSSProperties = { fontSize: '12px', color: COLORS.textMuted, cursor: 'pointer', padding: '8px 4px' }

const sectionHeaderStyle: CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: COLORS.textMuted,
  cursor: 'pointer',
}

const menuCardStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  left: 0,
  minWidth: '220px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  background: COLORS.bg,
  border: `1px solid ${COLORS.line}`,
  borderRadius: '8px',
  padding: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
  zIndex: 120,
}

const menuItemStyle: CSSProperties = {
  color: COLORS.text,
  fontSize: '13px',
  cursor: 'pointer',
  padding: '8px 12px',
  whiteSpace: 'nowrap',
}

const chipStyle: CSSProperties = {
  textAlign: 'center',
  padding: '12px 10px',
  borderRadius: '10px',
  border: `1px solid ${COLORS.line}`,
}

const chipValueStyle: CSSProperties = { fontSize: '20px', color: COLORS.text }

const chipLabelStyle: CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: COLORS.textMuted,
  marginTop: '2px',
}

const floatingBarButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  border: 'none',
  background: 'transparent',
  color: COLORS.bg,
  fontSize: '13px',
  padding: '10px 16px',
  borderRadius: '999px',
  cursor: 'pointer',
}

type VintageModalState = { mode: 'edit'; wine: Wine } | { mode: 'create' } | null

function formatTastedAt(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}.${month}.`
}

// Toggle-apuri Set-pohjaiselle "mitkä vuosikerrat/osiot ovat auki" -tilalle —
// jokainen vuosikerta ja sen kaksi osiota (Pullot/Arviot) laajenevat
// itsenäisesti, joten kolme erillistä Set:iä (wine.id avaimena) riittää eikä
// vaadi sisäkkäistä tilarakennetta.
function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

type VintageBlockProps = {
  wine: Wine
  vintageEditMode: boolean
  averageRating: number | undefined
  bottleCount: number
  averagePrice: number | undefined
  expanded: boolean
  bottlesOpen: boolean
  tastingsOpen: boolean
  onToggleExpanded: () => void
  onToggleBottles: () => void
  onToggleTastings: () => void
  onEditVintage: () => void
  onDeleteVintage: () => void
}

function VintageBlock({
  wine,
  vintageEditMode,
  averageRating,
  bottleCount,
  averagePrice,
  expanded,
  bottlesOpen,
  tastingsOpen,
  onToggleExpanded,
  onToggleBottles,
  onToggleTastings,
  onEditVintage,
  onDeleteVintage,
}: VintageBlockProps) {
  const t = useTranslation()
  const { data: tastings = [] } = useTastingsForWine(wine.id)
  const deleteTasting = useDeleteTasting()
  const bottleColor = WINE_TYPE_COLORS[wine.type] ?? COLORS.textMuted
  const bottleShape = getBottleShape({ type: wine.type })

  function handleDeleteTasting(id: string) {
    if (!window.confirm(t('confirm_delete_tasting'))) return
    deleteTasting.mutate(id)
  }

  return (
    <div
      id={`vintage-${wine.id}`}
      style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: `0.5px solid ${COLORS.line}` }}
    >
      <div onClick={onToggleExpanded} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
        <span style={{ color: COLORS.textMuted, fontSize: '12px', width: '10px' }}>{expanded ? '▾' : '▸'}</span>
        <span style={{ color: COLORS.text }}>{t('vintage_label').replace('{year}', String(wine.vintage ?? '–'))}</span>
        {bottleCount === 2 ? (
          <span style={{ display: 'flex', gap: '2px', color: bottleColor }}>
            <BottleIcon shape={bottleShape} />
            <BottleIcon shape={bottleShape} />
          </span>
        ) : bottleCount > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: bottleColor, fontSize: '13px' }}>
            <BottleIcon shape={bottleShape} />
            <span>×{bottleCount}</span>
          </span>
        ) : null}
        {averageRating != null && (
          <span style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>⭐ {averageRating.toFixed(1)}</span>
        )}
        {averagePrice != null && (
          <span style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>{Math.round(averagePrice)} €</span>
        )}
        {vintageEditMode && (
          <span style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <span
              onClick={(e) => {
                e.stopPropagation()
                onEditVintage()
              }}
              style={linkStyle}
            >
              {t('common_edit')}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation()
                onDeleteVintage()
              }}
              style={linkStyle}
            >
              {t('common_delete')}
            </span>
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div onClick={onToggleBottles} style={sectionHeaderStyle}>
              {bottlesOpen ? '▾' : '▸'} {t('vintage_bottles_section')}
            </div>
            {bottlesOpen && (
              <div style={{ marginTop: '8px' }}>
                <BottleManager wineId={wine.id} editMode={vintageEditMode} />
              </div>
            )}
          </div>

          <div>
            <div onClick={onToggleTastings} style={sectionHeaderStyle}>
              {tastingsOpen ? '▾' : '▸'} {t('vintage_tastings_section')}
            </div>
            {tastingsOpen &&
              (tastings.length === 0 ? (
                <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '8px 0 0' }}>
                  {t('bottle_empty_state')}
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '8px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {tastings.map((tasting) => (
                    <li
                      key={tasting.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: COLORS.textMuted }}
                    >
                      <span>
                        ★{tasting.rating ?? '–'} · {formatTastedAt(tasting.tastedAt)}
                        {tasting.score100 != null ? ` · ${tasting.score100}/100` : ''}
                        {tasting.note ? ` · ${tasting.note}` : ''}
                      </span>
                      {vintageEditMode && (
                        <span onClick={() => handleDeleteTasting(tasting.id)} style={linkStyle}>
                          {t('common_delete')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function WineDetailModal({ identity, onClose }: Props) {
  const t = useTranslation()
  const { data: wines = [] } = useWines()
  const [vintageEditMode, setVintageEditMode] = useState(false)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [showIdentityModal, setShowIdentityModal] = useState(false)
  const [showCreateBottle, setShowCreateBottle] = useState(false)
  const [vintageModal, setVintageModal] = useState<VintageModalState>(null)
  const [expandedVintages, setExpandedVintages] = useState<Set<string>>(new Set())
  const [openBottleSections, setOpenBottleSections] = useState<Set<string>>(new Set())
  const [openTastingSections, setOpenTastingSections] = useState<Set<string>>(new Set())
  const [selectedVintageId, setSelectedVintageId] = useState<string | null>(null)
  const deleteWine = useDeleteWine()
  const { data: bottleCounts = {} } = useBottleCounts()
  const { data: averagePrices = {} } = useAveragePrices()

  const name = identity.name.trim().toLowerCase()
  const producer = identity.producer.trim().toLowerCase()
  const wineGroup = wines
    .filter((wine) => wine.name.trim().toLowerCase() === name && wine.producer.trim().toLowerCase() === producer)
    .sort((a, b) => (b.vintage ?? -Infinity) - (a.vintage ?? -Infinity))

  const { data: averageRatings = {} } = useAverageRatingsByWine()
  const { data: groupAverageRating } = useGroupAverageRating(wineGroup.map((wine) => wine.id))

  if (wineGroup.length === 0) {
    return null
  }

  const first = wineGroup[0]
  const subtitle = first.appellation || (first.grapes.length > 0 ? first.grapes.join(', ') : first.type)
  // Rypäleet näytetään vain jos appellaatio on olemassa JA uusimmalla vuosikerralla
  // on rypäleet merkitty — vanhempia vuosikertoja ei etsitä.
  const showGrapesRow = Boolean(first.appellation) && first.grapes.length > 0

  const totalBottleCount = wineGroup.reduce((sum, wine) => sum + (bottleCounts[wine.id] ?? 0), 0)
  // Ei valmista "koko ryhmän keskihinta" -hookia — approksimoidaan vuosikertojen
  // omien keskihintojen keskiarvona (sama periaate kuin muualla sovelluksessa
  // kun ryhmätason lukua ei ole valmiiksi saatavilla per-tasting-pooling-muodossa).
  const pricesForGroup = wineGroup
    .map((wine) => averagePrices[wine.id])
    .filter((price): price is number => price != null)
  const groupAveragePrice =
    pricesForGroup.length > 0 ? pricesForGroup.reduce((sum, price) => sum + price, 0) / pricesForGroup.length : null

  const chips = [
    { key: 'bottles', value: String(totalBottleCount), label: t('stats_bottles_label') },
    {
      key: 'rating',
      value: groupAverageRating != null ? `⭐ ${groupAverageRating.toFixed(1)}` : '–',
      label: t('wine_detail_rating_label'),
    },
    {
      key: 'price',
      value: groupAveragePrice != null ? `${Math.round(groupAveragePrice)} €` : '–',
      label: t('wine_detail_price_label'),
    },
  ]

  const vintagesWithBottles = wineGroup.filter((wine) => (bottleCounts[wine.id] ?? 0) > 0)

  // Ei vielä "identiteetti liukuu ylös" -animaatiota tai erillistä tiivistettyä
  // tilaa — pelkkä vieritys alempana jo listattuun vuosikertaan + pillin oma
  // täytetty/ääriviivattu tila riittää tässä vaiheessa.
  function handleSelectVintage(wineId: string) {
    setSelectedVintageId(wineId)
    document.getElementById(`vintage-${wineId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ✎ avaa valikon vain kun vuosikertamuokkaus EI ole vielä päällä — jos se on,
  // ✎ toimii suoraan "Valmis"-nappina, jotta poistuminen ei vaadi valikon kautta
  // kulkemista.
  function handleEditIconClick() {
    if (vintageEditMode) {
      setVintageEditMode(false)
      return
    }
    setShowEditMenu((current) => !current)
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="modal-panel"
          style={{
            background: COLORS.bg,
            color: COLORS.text,
            maxHeight: '85vh',
            overflowY: 'auto',
            borderRadius: '12px',
          }}
        >
          <span onClick={onClose} style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>
            ← {t('common_back')}
          </span>

          <div style={{ marginTop: '24px', marginBottom: '40px' }}>
            {first.labelImageUrl ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                <img
                  src={first.labelImageUrl}
                  style={{
                    width: '62%',
                    height: 'clamp(280px, 45vh, 420px)',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    flexShrink: 0,
                    display: 'block',
                  }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: '10px' }}>
                  {chips.map((chip) => (
                    <div key={chip.key} style={chipStyle}>
                      <div style={chipValueStyle}>{chip.value}</div>
                      <div style={chipLabelStyle}>{chip.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                {chips.map((chip) => (
                  <div key={chip.key} style={{ ...chipStyle, flex: 1 }}>
                    <div style={chipValueStyle}>{chip.value}</div>
                    <div style={chipLabelStyle}>{chip.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '40px',
                  fontWeight: 400,
                  lineHeight: 1.15,
                  color: COLORS.text,
                }}
              >
                {first.name}
              </h2>
              <div style={{ color: COLORS.textMuted, fontSize: '0.9rem', marginTop: '6px' }}>{first.producer}</div>
              {subtitle && (
                <div style={{ color: COLORS.textMuted, fontSize: '0.85rem', marginTop: '4px' }}>{subtitle}</div>
              )}
              {showGrapesRow && (
                <div style={{ color: COLORS.textMuted, fontSize: '0.85rem', marginTop: '4px' }}>
                  {t('wine_grapes_prefix')}: {first.grapes.join(', ')}
                </div>
              )}
            </div>

            {vintagesWithBottles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
                {vintagesWithBottles.map((wine) => {
                  const selected = selectedVintageId === wine.id
                  return (
                    <button
                      key={wine.id}
                      type="button"
                      onClick={() => handleSelectVintage(wine.id)}
                      style={{
                        border: `1px solid ${COLORS.wineRed}`,
                        borderRadius: '999px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        background: selected ? COLORS.wineRed : 'transparent',
                        color: selected ? COLORS.bg : COLORS.text,
                      }}
                    >
                      {wine.vintage ?? '–'}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {wineGroup.map((wine) => (
            <VintageBlock
              key={wine.id}
              wine={wine}
              vintageEditMode={vintageEditMode}
              averageRating={averageRatings[wine.id]}
              bottleCount={bottleCounts[wine.id] ?? 0}
              averagePrice={averagePrices[wine.id]}
              expanded={expandedVintages.has(wine.id)}
              bottlesOpen={openBottleSections.has(wine.id)}
              tastingsOpen={openTastingSections.has(wine.id)}
              onToggleExpanded={() => setExpandedVintages((current) => toggleInSet(current, wine.id))}
              onToggleBottles={() => setOpenBottleSections((current) => toggleInSet(current, wine.id))}
              onToggleTastings={() => setOpenTastingSections((current) => toggleInSet(current, wine.id))}
              onEditVintage={() => setVintageModal({ mode: 'edit', wine })}
              onDeleteVintage={() => deleteWine.mutate(wine.id)}
            />
          ))}

          {vintageEditMode && (
            <span onClick={() => setVintageModal({ mode: 'create' })} style={linkStyle}>
              + {t('vintage_add_link')}
            </span>
          )}

          {/* Kelluva toimintopalkki — position: sticky suhteessa .modal-panel:iin
              (tämä on modaalin OMA vierityskontti, ks. overflowY: 'auto' yllä),
              ei koko sivuun; siksi se pysyy näkyvissä vain modaalin sisäisen
              vierityksen aikana eikä koskaan karkaa modaalin rajojen yli. */}
          <div
            style={{
              position: 'sticky',
              bottom: '16px',
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 50,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: COLORS.text,
                borderRadius: '999px',
                padding: '6px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowCreateBottle(true)}
                aria-label={t('bottle_add_link')}
                style={floatingBarButtonStyle}
              >
                <Plus size={16} color="currentColor" />
                {t('bottle_add_link')}
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={handleEditIconClick}
                  aria-label={vintageEditMode ? t('common_done') : t('common_edit')}
                  style={floatingBarButtonStyle}
                >
                  <Pencil size={16} color="currentColor" />
                  {vintageEditMode ? t('common_done') : t('common_edit')}
                </button>

                {showEditMenu && (
                  <>
                    <div onClick={() => setShowEditMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 110 }} />
                    <div onClick={(e) => e.stopPropagation()} style={menuCardStyle}>
                      <span
                        onClick={() => {
                          setShowEditMenu(false)
                          setShowIdentityModal(true)
                        }}
                        style={menuItemStyle}
                      >
                        {t('wine_edit_menu_identity')}
                      </span>
                      <span
                        onClick={() => {
                          setShowEditMenu(false)
                          setVintageEditMode(true)
                        }}
                        style={menuItemStyle}
                      >
                        {t('wine_edit_menu_vintage')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showIdentityModal && (
        <WineIdentityModal
          identity={identity}
          initialValues={{
            name: first.name,
            producer: first.producer,
            country: first.country,
            region: first.region,
            appellation: first.appellation,
            type: first.type,
            labelImageUrl: first.labelImageUrl,
          }}
          onClose={() => setShowIdentityModal(false)}
        />
      )}

      {vintageModal && (
        <VintageModal
          mode={vintageModal.mode}
          wine={vintageModal.mode === 'edit' ? vintageModal.wine : undefined}
          groupTemplate={first}
          onClose={() => setVintageModal(null)}
        />
      )}

      {showCreateBottle && (
        <BottleEditModal mode="create" wineId={first.id} onClose={() => setShowCreateBottle(false)} />
      )}
    </>
  )
}
