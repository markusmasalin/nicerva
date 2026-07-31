import { useRef, useState, type ChangeEvent } from 'react'
import {
  useCreateWine,
  useUpdateWine,
  useWines,
  uploadLabelImage,
  identifyWine,
  WineForm,
  WineFilters,
} from '../features/wines'
import type { Wine, NewWine, WineFilterParams, IdentifiedWine } from '../features/wines'
import { useCreateBottle, useBottleCounts } from '../features/inventory'
import { COLORS } from '../shared/colors'
import { CollectionOverview } from './CollectionOverview'
import { CollectionView } from './CollectionView'
import { WineDetailModal } from './WineDetailModal'
import { JustAddedToast } from './JustAddedToast'

const SCANNED_WINE_DEFAULTS: NewWine = {
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

// Muuntaa identify-wine-funktion tunnistaman viinin lomakkeen
// esitäyttödataksi — null-kentät jätetään tyhjiksi, käyttäjä täydentää loput.
function toScannedDraft(identified: IdentifiedWine): NewWine {
  return {
    ...SCANNED_WINE_DEFAULTS,
    name: identified.name ?? '',
    producer: identified.producer ?? '',
    country: identified.country ?? '',
    region: identified.region ?? '',
    appellation: identified.appellation,
    grapes: identified.grapes ?? [],
    vintage: identified.vintage,
    type: identified.type ?? 'red',
  }
}

// Tämä sivu on esimerkki siitä, miten wines- ja inventory-moduulit
// yhdistetään UI:ksi. Huomaa: tämä komponentti tuo kummastakin
// moduulista VAIN niiden index.ts:n kautta julkaistut asiat.
export function WinesPage() {
  const [filters, setFilters] = useState<WineFilterParams>({})
  const [editing, setEditing] = useState<Wine | null>(null)
  const [scanDraft, setScanDraft] = useState<NewWine | null>(null)
  const [scannedImageFile, setScannedImageFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [detailIdentity, setDetailIdentity] = useState<{ name: string; producer: string } | null>(null)
  const [justAdded, setJustAdded] = useState<{ name: string; type: string } | null>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  const { data: wines = [] } = useWines(filters)
  const { data: bottleCounts = {} } = useBottleCounts()
  const createWine = useCreateWine()
  const updateWine = useUpdateWine()
  const createBottle = useCreateBottle()

  function resetFormState() {
    setShowForm(false)
    setEditing(null)
    setScanDraft(null)
    setScannedImageFile(null)
  }

  async function handleScanFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!file) return

    setScanning(true)
    try {
      const result = await identifyWine(file)
      setScanDraft(toScannedDraft(result.wine))
    } catch {
      // Hiljainen fallback: lomake avataan tyhjänä, otettu kuva tallennetaan silti.
      setScanDraft(null)
    } finally {
      setScanning(false)
      setScannedImageFile(file)
      setEditing(null)
      setShowForm(true)
    }
  }

  async function handleSubmit(wine: NewWine, imageFile: File | null) {
    const fileToUpload = imageFile ?? scannedImageFile
    if (editing) {
      updateWine.mutate({ id: editing.id, wine })
      if (fileToUpload) {
        try {
          await uploadLabelImage(wine.name, wine.producer, fileToUpload)
        } catch {
          alert('Kuvan lataus epäonnistui.')
        }
      }
    } else {
      try {
        const created = await createWine.mutateAsync(wine)
        await createBottle.mutateAsync({
          wineId: created.id,
          purchasePrice: null,
          purchaseDate: null,
          location: null,
          status: 'cellar',
          note: null,
        })
        if (fileToUpload) {
          await uploadLabelImage(wine.name, wine.producer, fileToUpload)
        }
        setJustAdded({ name: created.name, type: created.type })
        setTimeout(() => setJustAdded(null), 3000)
      } catch {
        alert('Viinin tai pullon luonti epäonnistui.')
      }
    }
    resetFormState()
  }

  const countriesWithBottles = new Set(
    wines.filter((wine) => (bottleCounts[wine.id] ?? 0) > 0).map((wine) => wine.country),
  )

  return (
    <>
      <div className="page-container">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ margin: 0, letterSpacing: '0.05em', color: COLORS.text }}>NICERVA</h1>
          <p style={{ margin: '0.25rem 0 0', color: COLORS.textMuted }}>Sinun oma viinikellarisi</p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            paddingBottom: '12px',
            marginBottom: '24px',
            borderBottom: `1px solid ${COLORS.line}`,
          }}
        >
          <span
            onClick={() => setShowFilters((current) => !current)}
            style={{ color: COLORS.textMuted, fontSize: '12px', cursor: 'pointer', padding: '8px 4px' }}
          >
            Hae
          </span>
          <span
            onClick={() => {
              setScanDraft(null)
              setScannedImageFile(null)
              setEditing(null)
              setShowForm(true)
            }}
            style={{ color: COLORS.textMuted, fontSize: '12px', cursor: 'pointer', padding: '8px 4px' }}
          >
            + Löysin uuden viinin
          </span>
          <span
            onClick={() => scanInputRef.current?.click()}
            style={{ color: COLORS.textMuted, fontSize: '12px', cursor: 'pointer', padding: '8px 4px' }}
          >
            Skannaa pullo
          </span>
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleScanFileChange}
          />
        </div>

        {scanning && (
          <p style={{ color: COLORS.textMuted, fontSize: '12px', marginTop: 0 }}>Tunnistetaan...</p>
        )}

        {showFilters && <WineFilters filters={filters} onChange={setFilters} />}

        {showForm && (
          <WineForm
            key={editing?.id ?? (scanDraft ? 'scan' : 'new')}
            initial={editing ?? scanDraft ?? undefined}
            isEditing={editing !== null}
            onSubmit={handleSubmit}
            onCancel={resetFormState}
          />
        )}

        {countriesWithBottles.size >= 2 && <CollectionOverview wines={wines} bottleCounts={bottleCounts} />}

        <CollectionView filters={filters} onOpenWine={(identity) => setDetailIdentity(identity)} />
      </div>

      {detailIdentity && (
        <WineDetailModal identity={detailIdentity} onClose={() => setDetailIdentity(null)} />
      )}

      {justAdded && <JustAddedToast name={justAdded.name} type={justAdded.type} />}
    </>
  )
}
