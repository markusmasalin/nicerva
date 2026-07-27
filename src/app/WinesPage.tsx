import { useState } from 'react'
import { useCreateWine, useUpdateWine, useWines, uploadLabelImage, WineForm, WineFilters } from '../features/wines'
import type { Wine, NewWine, WineFilterParams } from '../features/wines'
import { useCreateBottle, useBottleCounts } from '../features/inventory'
import { COLORS } from '../shared/colors'
import { CollectionOverview } from './CollectionOverview'
import { CollectionView } from './CollectionView'
import { WineDetailModal } from './WineDetailModal'
import { JustAddedToast } from './JustAddedToast'

// Tämä sivu on esimerkki siitä, miten wines- ja inventory-moduulit
// yhdistetään UI:ksi. Huomaa: tämä komponentti tuo kummastakin
// moduulista VAIN niiden index.ts:n kautta julkaistut asiat.
export function WinesPage() {
  const [filters, setFilters] = useState<WineFilterParams>({})
  const [editing, setEditing] = useState<Wine | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [detailIdentity, setDetailIdentity] = useState<{ name: string; producer: string } | null>(null)
  const [justAdded, setJustAdded] = useState<{ name: string; type: string } | null>(null)

  const { data: wines = [] } = useWines(filters)
  const { data: bottleCounts = {} } = useBottleCounts()
  const createWine = useCreateWine()
  const updateWine = useUpdateWine()
  const createBottle = useCreateBottle()

  async function handleSubmit(wine: NewWine, imageFile: File | null) {
    if (editing) {
      updateWine.mutate({ id: editing.id, wine })
      if (imageFile) {
        try {
          await uploadLabelImage(wine.name, wine.producer, imageFile)
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
        if (imageFile) {
          await uploadLabelImage(wine.name, wine.producer, imageFile)
        }
        setJustAdded({ name: created.name, type: created.type })
        setTimeout(() => setJustAdded(null), 3000)
      } catch {
        alert('Viinin tai pullon luonti epäonnistui.')
      }
    }
    setShowForm(false)
    setEditing(null)
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <span
            onClick={() => setShowFilters((current) => !current)}
            style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer', padding: '8px 4px' }}
          >
            Hae
          </span>
          <span
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
            style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer', padding: '8px 4px' }}
          >
            + Löysin uuden viinin
          </span>
        </div>

        {showFilters && <WineFilters filters={filters} onChange={setFilters} />}

        {showForm && (
          <WineForm
            key={editing?.id ?? 'new'}
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditing(null)
            }}
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
