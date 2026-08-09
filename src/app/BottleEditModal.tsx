import { useState, type CSSProperties, type FormEvent } from 'react'
import { useCreateBottle, useUpdateBottle, useDeleteBottle } from '../features/inventory'
import type { Bottle, BottleStatus } from '../features/inventory'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'
import { useTranslation } from './LanguageContext'
import type { TranslationKey } from '../shared/translations'

const STATUS_LABEL_KEYS: Record<BottleStatus, TranslationKey> = {
  cellar: 'bottle_status_cellar',
  consumed: 'bottle_status_consumed',
  gifted: 'bottle_status_gifted',
}

const STATUSES: BottleStatus[] = ['cellar', 'consumed', 'gifted']

type Props = {
  mode: 'edit' | 'create'
  wineId: string
  bottle?: Bottle
  onClose: () => void
}

const buttonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.textMuted,
  fontSize: '13px',
  padding: '6px 12px',
  cursor: 'pointer',
}

const deleteLinkStyle: CSSProperties = {
  fontSize: '13px',
  color: COLORS.textMuted,
  cursor: 'pointer',
}

export function BottleEditModal({ mode, wineId, bottle, onClose }: Props) {
  const t = useTranslation()
  const [location, setLocation] = useState(bottle?.location ?? '')
  const [purchasePrice, setPurchasePrice] = useState(
    bottle?.purchasePrice != null ? String(bottle.purchasePrice) : '',
  )
  const [purchaseDate, setPurchaseDate] = useState(bottle?.purchaseDate ?? '')
  const [status, setStatus] = useState<BottleStatus>(bottle?.status ?? 'cellar')
  const [note, setNote] = useState(bottle?.note ?? '')
  const [saving, setSaving] = useState(false)
  const createBottle = useCreateBottle()
  const updateBottle = useUpdateBottle()
  const deleteBottle = useDeleteBottle()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      wineId,
      purchasePrice: purchasePrice ? Number(purchasePrice) : null,
      purchaseDate: purchaseDate || null,
      location: location || null,
      status,
      note: note || null,
    }

    setSaving(true)
    try {
      if (mode === 'edit' && bottle) {
        await updateBottle.mutateAsync({ id: bottle.id, bottle: payload })
      } else {
        await createBottle.mutateAsync(payload)
      }
      onClose()
    } catch {
      alert('Pullon tallennus epäonnistui.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!bottle) return
    if (!window.confirm(t('confirm_delete_bottle'))) return
    try {
      await deleteBottle.mutateAsync(bottle.id)
      onClose()
    } catch {
      alert('Pullon poisto epäonnistui.')
    }
  }

  return (
    <Modal title={mode === 'edit' ? t('bottle_modal_edit_title') : t('bottle_modal_create_title')} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          <div style={FIELD_LABEL_STYLE}>{t('bottle_location_label')}</div>
          <input value={location} onChange={(e) => setLocation(e.target.value)} style={FIELD_STYLE} />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>{t('wine_purchase_price_label')}</div>
          <input
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            style={FIELD_STYLE}
          />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>{t('wine_purchase_date_label')}</div>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            style={{ ...FIELD_STYLE, maxWidth: '200px' }}
          />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>{t('bottle_status_label')}</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BottleStatus)}
            style={{ ...FIELD_STYLE, appearance: 'none', WebkitAppearance: 'none' }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_LABEL_KEYS[s])}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>{t('bottle_note_label')}</div>
          <input value={note} onChange={(e) => setNote(e.target.value)} style={FIELD_STYLE} />
        </label>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button type="submit" disabled={saving} style={{ ...buttonStyle, opacity: saving ? 0.6 : 1 }}>
            {saving ? t('common_saving') : t('common_save')}
          </button>
          <button type="button" onClick={onClose} style={buttonStyle}>
            {t('common_cancel')}
          </button>
          {mode === 'edit' && (
            <span onClick={handleDelete} style={deleteLinkStyle}>
              {t('common_delete')}
            </span>
          )}
        </div>
      </form>
    </Modal>
  )
}
