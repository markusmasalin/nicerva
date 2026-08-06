import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import type { NewWine, WineType } from '../types'
import { COLORS } from '../../../shared/colors'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../../../shared/fieldStyles'

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

const buttonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.textMuted,
  fontSize: '13px',
  padding: '6px 12px',
  cursor: 'pointer',
}

export type PurchaseInfo = {
  purchasePrice: number | null
  purchaseDate: string | null
}

type Props = {
  initial?: NewWine
  isEditing: boolean
  onSubmit: (wine: NewWine, imageFile: File | null, purchaseInfo: PurchaseInfo) => void
  onCancel?: () => void
}

export function WineForm({ initial, isEditing, onSubmit, onCancel }: Props) {
  const [wine, setWine] = useState<NewWine>(initial ?? EMPTY_WINE)
  const [grapesInput, setGrapesInput] = useState(wine.grapes.join(', '))
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
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
      {
        purchasePrice: purchasePrice ? Number(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
      },
    )
  }

  const grapesSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${wine.name} ${wine.producer} ${wine.vintage ?? ''} rypäleet`,
  )}`

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <label>
        <div style={FIELD_LABEL_STYLE}>Nimi</div>
        <input
          placeholder="Minkä viinin löysit?"
          value={wine.name}
          onChange={(e) => setWine({ ...wine, name: e.target.value })}
          required
          style={FIELD_STYLE}
        />
      </label>
      <label>
        <div style={FIELD_LABEL_STYLE}>Tuottaja</div>
        <input
          placeholder="Kuka sen teki?"
          value={wine.producer}
          onChange={(e) => setWine({ ...wine, producer: e.target.value })}
          required
          style={FIELD_STYLE}
        />
      </label>
      <label>
        <div style={FIELD_LABEL_STYLE}>Maa</div>
        <input
          value={wine.country}
          onChange={(e) => setWine({ ...wine, country: e.target.value })}
          required
          style={FIELD_STYLE}
        />
      </label>
      <label>
        <div style={FIELD_LABEL_STYLE}>Alue</div>
        <input
          value={wine.region}
          onChange={(e) => setWine({ ...wine, region: e.target.value })}
          required
          style={FIELD_STYLE}
        />
      </label>
      <label>
        <div style={FIELD_LABEL_STYLE}>Vuosikerta</div>
        <input
          type="number"
          value={wine.vintage ?? ''}
          onChange={(e) => setWine({ ...wine, vintage: e.target.value ? Number(e.target.value) : null })}
          style={FIELD_STYLE}
        />
      </label>
      <label>
        <div style={FIELD_LABEL_STYLE}>Tyyppi</div>
        <select
          value={wine.type}
          onChange={(e) => setWine({ ...wine, type: e.target.value as WineType })}
          style={{ ...FIELD_STYLE, appearance: 'none', WebkitAppearance: 'none' }}
        >
          {WINE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

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
          <label>
            <div style={FIELD_LABEL_STYLE}>Appellaatio</div>
            <input
              value={wine.appellation ?? ''}
              onChange={(e) => setWine({ ...wine, appellation: e.target.value || null })}
              style={FIELD_STYLE}
            />
          </label>
          <label>
            <div style={{ ...FIELD_LABEL_STYLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Rypäleet</span>
              {wine.name.trim() !== '' && (
                <a
                  href={grapesSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: COLORS.textMuted, fontSize: '13px' }}
                >
                  Etsi verkosta
                </a>
              )}
            </div>
            <input
              placeholder="Pilkulla eroteltuna"
              value={grapesInput}
              onChange={(e) => setGrapesInput(e.target.value)}
              style={FIELD_STYLE}
            />
          </label>
          {!isEditing && (
            <>
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
                  style={FIELD_STYLE}
                />
              </label>
            </>
          )}
          <label>
            <div style={FIELD_LABEL_STYLE}>Muistiinpanot</div>
            <textarea
              value={wine.notes ?? ''}
              onChange={(e) => setWine({ ...wine, notes: e.target.value || null })}
              style={FIELD_STYLE}
            />
          </label>
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
          {isEditing ? 'Tallenna' : 'Lisää kokoelmaan'}
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
