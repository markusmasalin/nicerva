import { useState, type CSSProperties, type FormEvent } from 'react'
import { useUpdateBottle } from '../features/inventory'
import type { Bottle, NewBottle } from '../features/inventory'
import { useCreateTasting } from '../features/tastings'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'

type Props = {
  bottle: Bottle
  onClose: () => void
}

const RATINGS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

const buttonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.textMuted,
  fontSize: '13px',
  padding: '6px 12px',
  cursor: 'pointer',
}

const ratingButtonStyle: CSSProperties = {
  border: `1px solid ${COLORS.line}`,
  borderRadius: '8px',
  background: '#FFFFFF',
  color: COLORS.text,
  fontSize: '14px',
  padding: '8px 12px',
  cursor: 'pointer',
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function TastingModal({ bottle, onClose }: Props) {
  const [rating, setRating] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const updateBottle = useUpdateBottle()
  const createTasting = useCreateTasting()

  function consumedPayload(): NewBottle {
    return {
      wineId: bottle.wineId,
      purchasePrice: bottle.purchasePrice,
      purchaseDate: bottle.purchaseDate,
      location: bottle.location,
      status: 'consumed',
      note: bottle.note,
    }
  }

  async function handleSkip() {
    setSaving(true)
    try {
      await updateBottle.mutateAsync({ id: bottle.id, bottle: consumedPayload() })
      onClose()
    } catch {
      alert('Pullon merkintä juoduksi epäonnistui.')
      setSaving(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createTasting.mutateAsync({
        wineId: bottle.wineId,
        bottleId: bottle.id,
        rating,
        note: note || null,
        tastedAt: todayIsoDate(),
      })
      await updateBottle.mutateAsync({ id: bottle.id, bottle: consumedPayload() })
      onClose()
    } catch {
      alert('Maistelun tallennus epäonnistui.')
      setSaving(false)
    }
  }

  return (
    <Modal title="Cin cin!" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={FIELD_LABEL_STYLE}>Arvosana</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {RATINGS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                style={{
                  ...ratingButtonStyle,
                  background: rating === value ? COLORS.line : '#FFFFFF',
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <label>
          <div style={FIELD_LABEL_STYLE}>Kommentti</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} style={FIELD_STYLE} />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button type="submit" disabled={saving} style={buttonStyle}>
            Tallenna
          </button>
          <button type="button" onClick={handleSkip} disabled={saving} style={buttonStyle}>
            Ohita, merkitse vain juoduksi
          </button>
        </div>
      </form>
    </Modal>
  )
}
