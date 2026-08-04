import { useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { updateWineIdentity, uploadLabelImage } from '../features/wines'
import type { WineType } from '../features/wines'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'

const WINE_TYPES: WineType[] = ['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified']

type Identity = {
  name: string
  producer: string
}

type InitialValues = {
  name: string
  producer: string
  country: string
  region: string
  appellation: string | null
  type: WineType
  labelImageUrl: string | null
}

type Props = {
  identity: Identity
  initialValues: InitialValues
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

export function WineIdentityModal({ identity, initialValues, onClose }: Props) {
  const [name, setName] = useState(initialValues.name)
  const [producer, setProducer] = useState(initialValues.producer)
  const [country, setCountry] = useState(initialValues.country)
  const [region, setRegion] = useState(initialValues.region)
  const [appellation, setAppellation] = useState(initialValues.appellation ?? '')
  const [type, setType] = useState<WineType>(initialValues.type)
  const [labelImageUrl, setLabelImageUrl] = useState(initialValues.labelImageUrl)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  function handlePickImage() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const url = await uploadLabelImage(identity.name, identity.producer, file)
      setLabelImageUrl(url)
      queryClient.invalidateQueries({ queryKey: ['wines'] })
    } catch {
      alert('Kuvan lataus epäonnistui.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateWineIdentity(identity.name, identity.producer, {
        name,
        producer,
        country,
        region,
        appellation: appellation || null,
        type,
      })
      queryClient.invalidateQueries({ queryKey: ['wines'] })
      onClose()
    } catch {
      alert('Viinin tietojen tallennus epäonnistui.')
      setSaving(false)
    }
  }

  return (
    <Modal title="Muokkaa viiniä" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {labelImageUrl ? (
          <div>
            <img
              src={labelImageUrl}
              onClick={handlePickImage}
              style={{
                width: '64px',
                height: '96px',
                objectFit: 'cover',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'block',
              }}
            />
            <span
              onClick={handlePickImage}
              style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: COLORS.textMuted, cursor: 'pointer' }}
            >
              Vaihda kuva
            </span>
          </div>
        ) : (
          <span onClick={handlePickImage} style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>
            + Lisää kuva
          </span>
        )}

        <label>
          <div style={FIELD_LABEL_STYLE}>Nimi</div>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={FIELD_STYLE} />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Tuottaja</div>
          <input value={producer} onChange={(e) => setProducer(e.target.value)} required style={FIELD_STYLE} />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Maa</div>
          <input value={country} onChange={(e) => setCountry(e.target.value)} required style={FIELD_STYLE} />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Alue</div>
          <input value={region} onChange={(e) => setRegion(e.target.value)} required style={FIELD_STYLE} />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Appellaatio</div>
          <input value={appellation} onChange={(e) => setAppellation(e.target.value)} style={FIELD_STYLE} />
        </label>
        <label>
          <div style={FIELD_LABEL_STYLE}>Tyyppi</div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WineType)}
            style={{ ...FIELD_STYLE, appearance: 'none', WebkitAppearance: 'none' }}
          >
            {WINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
