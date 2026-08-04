import { useState, type CSSProperties, type FormEvent } from 'react'
import { useCreateBottle, useUpdateBottle, useDeleteBottle } from '../features/inventory'
import type { Bottle, BottleStatus } from '../features/inventory'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'

const STATUS_LABELS: Record<BottleStatus, string> = {
  cellar: 'Kellarissa',
  consumed: 'Juotu',
  gifted: 'Lahjoitettu',
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
    if (!window.confirm('Poistetaanko tämä pullo?')) return
    try {
      await deleteBottle.mutateAsync(bottle.id)
      onClose()
    } catch {
      alert('Pullon poisto epäonnistui.')
    }
  }

  return (
    <Modal title={mode === 'edit' ? 'Muokkaa pulloa' : 'Lisää pullo'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          <div style={FIELD_LABEL_STYLE}>Sijainti</div>
          <input value={location} onChange={(e) => setLocation(e.target.value)} style={FIELD_STYLE} />
        </label>
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
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} style={FIELD_STYLE} />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Status</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BottleStatus)}
            style={{ ...FIELD_STYLE, appearance: 'none', WebkitAppearance: 'none' }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Muistiinpano</div>
          <input value={note} onChange={(e) => setNote(e.target.value)} style={FIELD_STYLE} />
        </label>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button type="submit" disabled={saving} style={buttonStyle}>
            Tallenna
          </button>
          <button type="button" onClick={onClose} style={buttonStyle}>
            Peruuta
          </button>
          {mode === 'edit' && (
            <span onClick={handleDelete} style={deleteLinkStyle}>
              Poista
            </span>
          )}
        </div>
      </form>
    </Modal>
  )
}
