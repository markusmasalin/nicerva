import { useState, type CSSProperties } from 'react'
import { useWines, useDeleteWine } from '../features/wines'
import type { Wine } from '../features/wines'
import { BottleManager } from '../features/inventory'
import {
  useAverageRatingsByWine,
  useGroupAverageRating,
  useTastingsForWine,
  useDeleteTasting,
} from '../features/tastings'
import { COLORS } from '../shared/colors'
import { WineIdentityModal } from './WineIdentityModal'
import { VintageModal } from './VintageModal'
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

type VintageModalState = { mode: 'edit'; wine: Wine } | { mode: 'create' } | null

function formatTastedAt(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}.${month}.`
}

type VintageBlockProps = {
  wine: Wine
  editMode: boolean
  averageRating: number | undefined
  onEdit: () => void
  onDelete: () => void
}

function VintageBlock({ wine, editMode, averageRating, onEdit, onDelete }: VintageBlockProps) {
  const t = useTranslation()
  const { data: tastings = [] } = useTastingsForWine(wine.id)
  const deleteTasting = useDeleteTasting()

  function handleDeleteTasting(id: string) {
    if (!window.confirm(t('confirm_delete_tasting'))) return
    deleteTasting.mutate(id)
  }

  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <span style={{ color: COLORS.text }}>{t('vintage_label').replace('{year}', String(wine.vintage ?? '–'))}</span>
        {averageRating != null && (
          <span style={{ color: COLORS.textMuted, fontSize: '0.85rem' }}>⭐ {averageRating.toFixed(1)}</span>
        )}
        {editMode && (
          <>
            <span onClick={onEdit} style={linkStyle}>
              {t('common_edit')}
            </span>
            <span onClick={onDelete} style={linkStyle}>
              {t('common_delete')}
            </span>
          </>
        )}
      </div>
      <BottleManager wineId={wine.id} editMode={editMode} />
      {tastings.length > 0 && (
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
              </span>
              {editMode && (
                <span onClick={() => handleDeleteTasting(tasting.id)} style={linkStyle}>
                  {t('common_delete')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function WineDetailModal({ identity, onClose }: Props) {
  const t = useTranslation()
  const { data: wines = [] } = useWines()
  const [editMode, setEditMode] = useState(false)
  const [showIdentityModal, setShowIdentityModal] = useState(false)
  const [vintageModal, setVintageModal] = useState<VintageModalState>(null)
  const deleteWine = useDeleteWine()

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
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span onClick={() => setEditMode((current) => !current)} style={linkStyle}>
                {editMode ? t('common_done') : t('common_edit')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 400, color: COLORS.text }}>{first.name}</h2>
                <div style={{ color: COLORS.textMuted, fontSize: '0.9rem', marginTop: '4px' }}>{first.producer}</div>
                {subtitle && (
                  <div style={{ color: COLORS.textMuted, fontSize: '0.85rem', marginTop: '4px' }}>{subtitle}</div>
                )}
                {showGrapesRow && (
                  <div style={{ color: COLORS.textMuted, fontSize: '0.85rem', marginTop: '4px' }}>
                    {t('wine_grapes_prefix')}: {first.grapes.join(', ')}
                  </div>
                )}
                {groupAverageRating != null && (
                  <div style={{ color: COLORS.textMuted, fontSize: '0.85rem', marginTop: '4px' }}>
                    ⭐ {groupAverageRating.toFixed(1)}
                  </div>
                )}
                {editMode && (
                  <span
                    onClick={() => setShowIdentityModal(true)}
                    style={{ ...linkStyle, display: 'inline-block', padding: '8px 0' }}
                  >
                    {t('common_edit')}
                  </span>
                )}
              </div>
              {first.labelImageUrl && (
                <img
                  src={first.labelImageUrl}
                  style={{
                    width: '88px',
                    height: '88px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    flexShrink: 0,
                    display: 'block',
                  }}
                />
              )}
            </div>
          </div>

          {wineGroup.map((wine) => (
            <VintageBlock
              key={wine.id}
              wine={wine}
              editMode={editMode}
              averageRating={averageRatings[wine.id]}
              onEdit={() => setVintageModal({ mode: 'edit', wine })}
              onDelete={() => deleteWine.mutate(wine.id)}
            />
          ))}

          {editMode && (
            <span onClick={() => setVintageModal({ mode: 'create' })} style={linkStyle}>
              + {t('vintage_add_link')}
            </span>
          )}
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
    </>
  )
}
