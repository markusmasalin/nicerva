import { useState, type FormEvent } from 'react'
import type { NewBottle } from '../types'

type Props = {
  wineId: string
  onSubmit: (bottle: NewBottle) => void
  onCancel?: () => void
}

export function BottleForm({ wineId, onSubmit, onCancel }: Props) {
  const [bottle, setBottle] = useState<NewBottle>({
    wineId,
    purchasePrice: null,
    purchaseDate: null,
    location: null,
    status: 'cellar',
    note: null,
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(bottle)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        placeholder="Sijainti (esim. Hylly A3)"
        value={bottle.location ?? ''}
        onChange={(e) => setBottle({ ...bottle, location: e.target.value || null })}
      />
      <input
        placeholder="Ostohinta €"
        type="number"
        step="0.01"
        value={bottle.purchasePrice ?? ''}
        onChange={(e) => setBottle({ ...bottle, purchasePrice: e.target.value ? Number(e.target.value) : null })}
      />
      <input
        placeholder="Ostopäivä"
        type="date"
        value={bottle.purchaseDate ?? ''}
        onChange={(e) => setBottle({ ...bottle, purchaseDate: e.target.value || null })}
      />
      <input
        placeholder="Muistiinpano"
        value={bottle.note ?? ''}
        onChange={(e) => setBottle({ ...bottle, note: e.target.value || null })}
      />
      <button type="submit">Lisää pullo</button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Peruuta
        </button>
      )}
    </form>
  )
}
