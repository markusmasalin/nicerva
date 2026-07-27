import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import type { NewWine, WineType } from '../types'
import { COLORS } from '../../../shared/colors'

const WINE_TYPES: WineType[] = ['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified']

const EMPTY_WINE: NewWine = {
  name: '',
  producer: '',
  country: '',
  region: '',
  appellation: null,
  grapes: [],
  vintage: null,
  type: 'red',
  notes: null,
  labelImageUrl: null,
}

const fieldStyle: CSSProperties = {
  border: 'none',
  borderBottom: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.text,
  colorScheme: 'light',
  fontSize: '14px',
  padding: '6px 2px',
}

const buttonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.textMuted,
  fontSize: '13px',
  padding: '6px 12px',
  cursor: 'pointer',
}

type Props = {
  initial?: NewWine
  onSubmit: (wine: NewWine, imageFile: File | null) => void
  onCancel?: () => void
}

export function WineForm({ initial, onSubmit, onCancel }: Props) {
  const [wine, setWine] = useState<NewWine>(initial ?? EMPTY_WINE)
  const [grapesInput, setGrapesInput] = useState(wine.grapes.join(', '))
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasHiddenFieldValue = Boolean(initial?.appellation || (initial?.grapes.length ?? 0) > 0 || initial?.notes)
  const [showMoreFields, setShowMoreFields] = useState(hasHiddenFieldValue)

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : (initial?.labelImageUrl ?? null)),
    [selectedFile, initial?.labelImageUrl],
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(
      {
        ...wine,
        grapes: grapesInput.split(',').map((g) => g.trim()).filter(Boolean),
      },
      selectedFile,
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: 400 }}>
      <input
        placeholder="Minkä viinin löysit?"
        value={wine.name}
        onChange={(e) => setWine({ ...wine, name: e.target.value })}
        required
        style={fieldStyle}
      />
      <input
        placeholder="Kuka sen teki?"
        value={wine.producer}
        onChange={(e) => setWine({ ...wine, producer: e.target.value })}
        required
        style={fieldStyle}
      />
      <input
        placeholder="Maa"
        value={wine.country}
        onChange={(e) => setWine({ ...wine, country: e.target.value })}
        required
        style={fieldStyle}
      />
      <input
        placeholder="Alue"
        value={wine.region}
        onChange={(e) => setWine({ ...wine, region: e.target.value })}
        required
        style={fieldStyle}
      />
      <input
        placeholder="Vuosikerta"
        type="number"
        value={wine.vintage ?? ''}
        onChange={(e) => setWine({ ...wine, vintage: e.target.value ? Number(e.target.value) : null })}
        style={fieldStyle}
      />
      <select
        value={wine.type}
        onChange={(e) => setWine({ ...wine, type: e.target.value as WineType })}
        style={{ ...fieldStyle, appearance: 'none', WebkitAppearance: 'none' }}
      >
        {WINE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        <img
          src={previewUrl}
          onClick={() => fileInputRef.current?.click()}
          style={{ width: '32px', height: '48px', objectFit: 'cover', cursor: 'pointer' }}
        />
      ) : (
        <span
          onClick={() => fileInputRef.current?.click()}
          style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}
        >
          + Lisää kuva
        </span>
      )}

      {showMoreFields ? (
        <>
          <input
            placeholder="Appellation"
            value={wine.appellation ?? ''}
            onChange={(e) => setWine({ ...wine, appellation: e.target.value || null })}
            style={fieldStyle}
          />
          <input
            placeholder="Rypäleet (pilkulla eroteltuna)"
            value={grapesInput}
            onChange={(e) => setGrapesInput(e.target.value)}
            style={fieldStyle}
          />
          <textarea
            placeholder="Muistiinpanot"
            value={wine.notes ?? ''}
            onChange={(e) => setWine({ ...wine, notes: e.target.value || null })}
            style={fieldStyle}
          />
        </>
      ) : (
        <span
          onClick={() => setShowMoreFields(true)}
          style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}
        >
          + Lisää tarkempia tietoja
        </span>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" style={buttonStyle}>
          {initial ? 'Tallenna' : 'Lisää kokoelmaan'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={buttonStyle}>
            Peruuta
          </button>
        )}
      </div>
    </form>
  )
}
