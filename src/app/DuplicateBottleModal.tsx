import { useState, type CSSProperties, type FormEvent } from 'react'
import { useCreateBottle } from '../features/inventory'
import type { Wine } from '../features/wines'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'
import { useTranslation } from './LanguageContext'

type Props = {
  matchedWine: Wine
  onClose: () => void
  onCreated: () => void
}

const buttonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.textMuted,
  fontSize: '13px',
  padding: '6px 12px',
  cursor: 'pointer',
}

export function DuplicateBottleModal({ matchedWine, onClose, onCreated }: Props) {
  const t = useTranslation()
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [saving, setSaving] = useState(false)
  const createBottle = useCreateBottle()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createBottle.mutateAsync({
        wineId: matchedWine.id,
        purchasePrice: purchasePrice ? Number(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        location: null,
        status: 'cellar',
        note: null,
      })
      onCreated()
      onClose()
    } catch {
      alert('Pullon lisäys epäonnistui.')
      setSaving(false)
    }
  }

  return (
    <Modal title="Löytyi jo kokoelmastasi" onClose={onClose}>
      <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: 0 }}>
        {matchedWine.name} ({matchedWine.producer}) on jo kokoelmassasi.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          <div style={FIELD_LABEL_STYLE}>Ostohinta €</div>
          <input
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            style={FIELD_STYLE}
          />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Ostopäivä</div>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            style={{ ...FIELD_STYLE, maxWidth: '200px' }}
          />
        </label>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving} style={{ ...buttonStyle, opacity: saving ? 0.6 : 1 }}>
            {saving ? t('common_adding') : 'Lisää pullo'}
          </button>
          <button type="button" onClick={onClose} style={buttonStyle}>
            Peruuta
          </button>
        </div>
      </form>
    </Modal>
  )
}
