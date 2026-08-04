import { useState, type CSSProperties, type FormEvent } from 'react'
import { useCreateWine, useUpdateWine } from '../features/wines'
import type { Wine } from '../features/wines'
import { useCreateBottle } from '../features/inventory'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'

type Props = {
  mode: 'edit' | 'create'
  wine?: Wine
  groupTemplate?: Wine
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

export function VintageModal({ mode, wine, groupTemplate, onClose }: Props) {
  const [vintage, setVintage] = useState(wine?.vintage != null ? String(wine.vintage) : '')
  const [grapesInput, setGrapesInput] = useState(wine?.grapes.join(', ') ?? '')
  const [saving, setSaving] = useState(false)
  const updateWine = useUpdateWine()
  const createWine = useCreateWine()
  const createBottle = useCreateBottle()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const grapes = grapesInput
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean)
    const vintageValue = vintage ? Number(vintage) : null

    setSaving(true)
    try {
      if (mode === 'edit' && wine) {
        await updateWine.mutateAsync({ id: wine.id, wine: { ...wine, vintage: vintageValue, grapes } })
      } else if (mode === 'create' && groupTemplate) {
        const created = await createWine.mutateAsync({
          name: groupTemplate.name,
          producer: groupTemplate.producer,
          country: groupTemplate.country,
          region: groupTemplate.region,
          appellation: groupTemplate.appellation,
          grapes,
          vintage: vintageValue,
          type: groupTemplate.type,
          notes: groupTemplate.notes,
          labelImageUrl: groupTemplate.labelImageUrl,
        })
        await createBottle.mutateAsync({
          wineId: created.id,
          purchasePrice: null,
          purchaseDate: null,
          location: null,
          status: 'cellar',
          note: null,
        })
      }
      onClose()
    } catch {
      alert('Vuosikerran tallennus epäonnistui.')
      setSaving(false)
    }
  }

  return (
    <Modal title={mode === 'edit' ? 'Muokkaa vuosikertaa' : 'Lisää vuosikerta'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          <div style={FIELD_LABEL_STYLE}>Vuosikerta</div>
          <input type="number" value={vintage} onChange={(e) => setVintage(e.target.value)} style={FIELD_STYLE} />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Rypäleet</div>
          <input
            placeholder="Pilkulla eroteltuna"
            value={grapesInput}
            onChange={(e) => setGrapesInput(e.target.value)}
            style={FIELD_STYLE}
          />
        </label>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving} style={buttonStyle}>
            Tallenna
          </button>
          <button type="button" onClick={onClose} style={buttonStyle}>
            Peruuta
          </button>
        </div>
      </form>
    </Modal>
  )
}
