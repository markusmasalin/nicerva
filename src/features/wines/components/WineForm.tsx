import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import type { NewWine, WineType } from '../types'
import { enrichWine } from '../api'
import { searchProducers } from '../../producers'
import type { Producer } from '../../producers'
import { COLORS } from '../../../shared/colors'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../../../shared/fieldStyles'
import { useTranslation } from '../../../app/LanguageContext'
import type { TranslationKey } from '../../../shared/translations'
import { CountryPicker } from '../../../shared/CountryPicker'
import { getKnownRegions } from '../../../shared/regions'
import { normalizeText } from '../../../shared/normalizeText'

const SEARCH_DEBOUNCE_MS = 300

const WINE_TYPES: WineType[] = ['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified']

const WINE_TYPE_LABEL_KEYS: Record<WineType, TranslationKey> = {
  red: 'wine_type_red',
  white: 'wine_type_white',
  rose: 'wine_type_rose',
  sparkling: 'wine_type_sparkling',
  dessert: 'wine_type_dessert',
  fortified: 'wine_type_fortified',
}

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
  onSubmit: (wine: NewWine, imageFile: File | null, purchaseInfo: PurchaseInfo) => void | Promise<void>
  onCancel?: () => void
}

export function WineForm({ initial, isEditing, onSubmit, onCancel }: Props) {
  const t = useTranslation()
  const [wine, setWine] = useState<NewWine>(initial ?? EMPTY_WINE)
  const [grapesInput, setGrapesInput] = useState(wine.grapes.join(', '))
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [producerSuggestions, setProducerSuggestions] = useState<Producer[]>([])
  const [producerSearchComplete, setProducerSearchComplete] = useState(false)
  const [suppressProducerSuggestions, setSuppressProducerSuggestions] = useState(false)
  const [regionSuggestions, setRegionSuggestions] = useState<string[]>([])
  const [suppressRegionSuggestions, setSuppressRegionSuggestions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasHiddenFieldValue = Boolean(initial?.appellation || (initial?.grapes.length ?? 0) > 0 || initial?.notes)
  const [showMoreFields, setShowMoreFields] = useState(hasHiddenFieldValue)

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : (initial?.labelImageUrl ?? null)),
    [selectedFile, initial?.labelImageUrl],
  )

  useEffect(() => {
    if (suppressProducerSuggestions || wine.producer.trim().length < 2) {
      setProducerSuggestions([])
      setProducerSearchComplete(false)
      return
    }
    setProducerSearchComplete(false)
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const results = await searchProducers(wine.producer)
        if (!cancelled) {
          setProducerSuggestions(results)
          setProducerSearchComplete(true)
        }
      } catch {
        if (!cancelled) {
          setProducerSuggestions([])
          setProducerSearchComplete(true)
        }
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [wine.producer, suppressProducerSuggestions])

  useEffect(() => {
    if (suppressRegionSuggestions || !wine.country || wine.region.trim().length < 2) {
      setRegionSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      const query = normalizeText(wine.region)
      setRegionSuggestions(getKnownRegions(wine.country).filter((region) => normalizeText(region).includes(query)).slice(0, 8))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [wine.region, wine.country, suppressRegionSuggestions])

  function selectProducer(producer: Producer) {
    setWine((current) => ({
      ...current,
      producer: producer.name,
      country: current.country || producer.country || '',
      region: current.region || producer.region || '',
    }))
    setSuppressProducerSuggestions(true)
    setProducerSuggestions([])
  }

  // Ei enää kirjoita tietokantaan tässä kohtaa — tuottajan olemassaolo
  // tarkistetaan/luodaan vasta lomakkeen lopullisessa lähetyksessä
  // (ks. ensureProducer-kutsu WinesPage.tsx:n handleSubmitissa).
  function handleAddNewProducer() {
    setSuppressProducerSuggestions(true)
    setProducerSuggestions([])
  }

  // Ei "+ Lisää uutena alueena" -linkkiä kuten tuottajahaulla — region.ts on
  // kiinteä staattinen data, ei tietokantataulu, joten vapaa kirjoittaminen
  // ilman valintaa toimii jo suoraan ilman erillistä vahvistusaskelta.
  function selectRegion(region: string) {
    setWine((current) => ({ ...current, region }))
    setSuppressRegionSuggestions(true)
    setRegionSuggestions([])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(
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
    } finally {
      // Lomake sulkeutuu yleensä onnistuneen lähetyksen jälkeen (komponentti
      // unmountataan), jolloin tämä setState on no-op — harmiton React 19:ssä.
      setIsSubmitting(false)
    }
  }

  const grapesSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${wine.name} ${wine.producer} ${wine.vintage ?? ''} grapes`,
  )}`

  const currentGrapes = grapesInput
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)

  // "type" ei koskaan ole tyhjä tässä lomakkeessa (select oletusarvoineen
  // 'red'), joten sitä ei voi luotettavasti erottaa käyttäjän valinnasta —
  // nappi näytetään siis alue/rypäle-kenttien perusteella, eikä täydennys
  // koskaan ylikirjoita type-kenttää (ks. handleEnrich).
  const showEnrichButton =
    wine.name.trim() !== '' && wine.producer.trim() !== '' && (wine.region.trim() === '' || currentGrapes.length === 0)

  async function handleEnrich() {
    setEnriching(true)
    try {
      const result = await enrichWine({
        name: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        country: wine.country || null,
        region: wine.region || null,
        appellation: wine.appellation,
      })
      const enriched = result.wine
      setWine((current) => ({
        ...current,
        country: current.country || enriched.country || '',
        region: current.region || enriched.region || '',
        appellation: current.appellation || enriched.appellation,
      }))
      if (currentGrapes.length === 0 && enriched.grapes && enriched.grapes.length > 0) {
        setGrapesInput(enriched.grapes.join(', '))
      }
    } catch {
      alert(t('wine_enrich_error'))
    } finally {
      setEnriching(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <label>
        <div style={FIELD_LABEL_STYLE}>{t('wine_name_label')}</div>
        <input
          placeholder={t('wine_name_placeholder')}
          value={wine.name}
          onChange={(e) => setWine({ ...wine, name: e.target.value })}
          required
          style={FIELD_STYLE}
        />
      </label>
      <label>
        <div style={FIELD_LABEL_STYLE}>{t('wine_producer_label')}</div>
        <input
          placeholder={t('wine_producer_placeholder')}
          value={wine.producer}
          onChange={(e) => {
            setWine({ ...wine, producer: e.target.value })
            setSuppressProducerSuggestions(false)
          }}
          required
          style={FIELD_STYLE}
        />
      </label>
      {producerSuggestions.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: '-8px 0 0',
            padding: 0,
            border: `1px solid ${COLORS.line}`,
            borderRadius: '8px',
            background: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          {producerSuggestions.map((producer, index) => (
            <li
              key={producer.id}
              onClick={() => selectProducer(producer)}
              style={{
                padding: '10px 14px',
                fontSize: '14px',
                color: COLORS.text,
                cursor: 'pointer',
                borderBottom: index < producerSuggestions.length - 1 ? `1px solid ${COLORS.line}` : 'none',
              }}
            >
              {producer.name}
              {(producer.country || producer.region) && (
                <span style={{ color: COLORS.textMuted }}>
                  {' '}
                  ({[producer.country, producer.region].filter(Boolean).join(', ')})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {producerSuggestions.length === 0 &&
        producerSearchComplete &&
        !suppressProducerSuggestions &&
        wine.producer.trim().length >= 2 && (
          <span
            onClick={handleAddNewProducer}
            style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}
          >
            {t('producer_add_new').replace('{name}', wine.producer.trim())}
          </span>
        )}
      <label>
        <div style={FIELD_LABEL_STYLE}>{t('wine_country_label')}</div>
        <CountryPicker
          value={wine.country}
          onChange={(code) => setWine({ ...wine, country: code ?? '' })}
          required
        />
      </label>
      <label>
        <div style={FIELD_LABEL_STYLE}>{t('wine_region_label')}</div>
        <input
          placeholder={t('wine_region_placeholder')}
          value={wine.region}
          onChange={(e) => {
            setWine({ ...wine, region: e.target.value })
            setSuppressRegionSuggestions(false)
          }}
          required
          style={FIELD_STYLE}
        />
      </label>
      {regionSuggestions.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: '-8px 0 0',
            padding: 0,
            border: `1px solid ${COLORS.line}`,
            borderRadius: '8px',
            background: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          {regionSuggestions.map((region, index) => (
            <li
              key={region}
              onClick={() => selectRegion(region)}
              style={{
                padding: '10px 14px',
                fontSize: '14px',
                color: COLORS.text,
                cursor: 'pointer',
                borderBottom: index < regionSuggestions.length - 1 ? `1px solid ${COLORS.line}` : 'none',
              }}
            >
              {region}
            </li>
          ))}
        </ul>
      )}
      <label>
        <div style={FIELD_LABEL_STYLE}>{t('wine_vintage_label')}</div>
        <input
          type="number"
          placeholder={t('wine_vintage_placeholder')}
          value={wine.vintage ?? ''}
          onChange={(e) => setWine({ ...wine, vintage: e.target.value ? Number(e.target.value) : null })}
          style={FIELD_STYLE}
        />
      </label>
      <label>
        <div style={FIELD_LABEL_STYLE}>{t('wine_type_label')}</div>
        <select
          value={wine.type}
          onChange={(e) => setWine({ ...wine, type: e.target.value as WineType })}
          style={{ ...FIELD_STYLE, appearance: 'none', WebkitAppearance: 'none' }}
        >
          {WINE_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(WINE_TYPE_LABEL_KEYS[type])}
            </option>
          ))}
        </select>
      </label>

      {showEnrichButton && (
        <button type="button" onClick={handleEnrich} disabled={enriching} style={{ ...buttonStyle, opacity: enriching ? 0.6 : 1 }}>
          {t('wine_enrich_button')}
        </button>
      )}

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
          + {t('wine_add_image')}
        </span>
      )}

      {showMoreFields ? (
        <>
          <label>
            <div style={FIELD_LABEL_STYLE}>{t('wine_appellation_label')}</div>
            <input
              placeholder={t('wine_appellation_placeholder')}
              value={wine.appellation ?? ''}
              onChange={(e) => setWine({ ...wine, appellation: e.target.value || null })}
              style={FIELD_STYLE}
            />
          </label>
          <label>
            <div style={{ ...FIELD_LABEL_STYLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('wine_grapes_label')}</span>
              {wine.name.trim() !== '' && (
                <a
                  href={grapesSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: COLORS.textMuted, fontSize: '13px' }}
                >
                  {t('wine_search_online_link')}
                </a>
              )}
            </div>
            <input
              placeholder={t('wine_grapes_placeholder')}
              value={grapesInput}
              onChange={(e) => setGrapesInput(e.target.value)}
              style={FIELD_STYLE}
            />
          </label>
          {!isEditing && (
            <>
              <label>
                <div style={FIELD_LABEL_STYLE}>{t('wine_purchase_price_label')}</div>
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('wine_purchase_price_placeholder')}
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
            </>
          )}
          <label>
            <div style={FIELD_LABEL_STYLE}>{t('wine_notes_label')}</div>
            <textarea
              placeholder={t('wine_notes_placeholder')}
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
          {t('wine_more_details_link')}
        </span>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" disabled={isSubmitting} style={{ ...buttonStyle, opacity: isSubmitting ? 0.6 : 1 }}>
          {isSubmitting
            ? isEditing
              ? t('common_saving')
              : t('common_adding')
            : isEditing
              ? t('common_save')
              : t('wine_save_new')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={buttonStyle}>
            {t('common_cancel')}
          </button>
        )}
      </div>
      </form>

      {enriching && (
        <>
          <style>{`
            @keyframes wine-enrich-spinner-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              padding: '16px',
            }}
          >
            <div
              style={{
                background: COLORS.bg,
                color: COLORS.text,
                borderRadius: '12px',
                padding: '32px 40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: `3px solid ${COLORS.line}`,
                  borderTopColor: COLORS.wineRed,
                  animation: 'wine-enrich-spinner-spin 0.8s linear infinite',
                }}
              />
              <span style={{ color: COLORS.text, fontSize: '17px' }}>{t('wine_enrich_loading')}</span>
            </div>
          </div>
        </>
      )}
    </>
  )
}
