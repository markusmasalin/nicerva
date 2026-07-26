import { useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWines, useUpdateWine, useDeleteWine, useCreateWine, uploadLabelImage, WineForm } from '../features/wines'
import type { Wine } from '../features/wines'
import { useCreateBottle, BottleManager } from '../features/inventory'
import { COLORS } from '../shared/colors'

type Identity = {
  name: string
  producer: string
}

type Props = {
  identity: Identity
  onClose: () => void
}

const linkStyle: CSSProperties = { fontSize: '12px', color: COLORS.textMuted, cursor: 'pointer' }

const vintageInputStyle: CSSProperties = {
  border: 'none',
  borderBottom: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.text,
  colorScheme: 'light',
  fontSize: '14px',
  padding: '6px 2px',
  width: '100px',
}

export function WineDetailModal({ identity, onClose }: Props) {
  const { data: wines = [] } = useWines()
  const [editingWine, setEditingWine] = useState<Wine | null>(null)
  const [addingVintage, setAddingVintage] = useState(false)
  const [newVintage, setNewVintage] = useState('')
  const [uploadTargetWineId, setUploadTargetWineId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const updateWine = useUpdateWine()
  const deleteWine = useDeleteWine()
  const createWine = useCreateWine()
  const createBottle = useCreateBottle()

  function handlePickImage(wineId: string) {
    setUploadTargetWineId(wineId)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uploadTargetWineId) return
    try {
      await uploadLabelImage(uploadTargetWineId, file)
      queryClient.invalidateQueries({ queryKey: ['wines'] })
    } catch {
      alert('Kuvan lataus epäonnistui.')
    } finally {
      setUploadTargetWineId(null)
    }
  }

  const name = identity.name.trim().toLowerCase()
  const producer = identity.producer.trim().toLowerCase()
  const wineGroup = wines
    .filter((wine) => wine.name.trim().toLowerCase() === name && wine.producer.trim().toLowerCase() === producer)
    .sort((a, b) => (b.vintage ?? -Infinity) - (a.vintage ?? -Infinity))

  if (wineGroup.length === 0) {
    return null
  }

  const first = wineGroup[0]
  const subtitle = first.appellation || (first.grapes.length > 0 ? first.grapes.join(', ') : first.type)

  async function handleAddVintage() {
    try {
      const created = await createWine.mutateAsync({
        name: first.name,
        producer: first.producer,
        country: first.country,
        region: first.region,
        appellation: first.appellation,
        grapes: first.grapes,
        vintage: newVintage ? Number(newVintage) : null,
        type: first.type,
        notes: first.notes,
        labelImageUrl: first.labelImageUrl,
      })
      await createBottle.mutateAsync({
        wineId: created.id,
        purchasePrice: null,
        purchaseDate: null,
        location: null,
        status: 'cellar',
        note: null,
      })
      setAddingVintage(false)
      setNewVintage('')
    } catch {
      alert('Vuosikerran lisäys epäonnistui.')
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.bg,
          color: COLORS.text,
          maxWidth: '640px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '40px',
          borderRadius: '12px',
        }}
      >
        <span onClick={onClose} style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>
          ← Takaisin
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div style={{ marginTop: '24px', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 400, color: COLORS.text }}>{first.name}</h2>
          <div style={{ color: COLORS.textMuted, fontSize: '0.9rem', marginTop: '4px' }}>{first.producer}</div>
          {subtitle && (
            <div style={{ color: COLORS.textMuted, fontSize: '0.85rem', marginTop: '4px' }}>{subtitle}</div>
          )}
        </div>

        {wineGroup.map((wine) => (
          <div key={wine.id} style={{ marginBottom: '40px' }}>
            {editingWine?.id === wine.id ? (
              <WineForm
                initial={wine}
                onSubmit={(updated) => {
                  updateWine.mutate({ id: wine.id, wine: updated })
                  setEditingWine(null)
                }}
                onCancel={() => setEditingWine(null)}
              />
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <span style={{ color: COLORS.text }}>Vuosikerta {wine.vintage ?? '–'}</span>
                  <span
                    onClick={() => setEditingWine(wine)}
                    style={{ fontSize: '12px', color: COLORS.textMuted, cursor: 'pointer' }}
                  >
                    Muokkaa
                  </span>
                  <span
                    onClick={() => deleteWine.mutate(wine.id)}
                    style={{ fontSize: '12px', color: COLORS.textMuted, cursor: 'pointer' }}
                  >
                    Poista
                  </span>
                  {wine.labelImageUrl ? (
                    <img
                      src={wine.labelImageUrl}
                      onClick={() => handlePickImage(wine.id)}
                      style={{ width: '20px', height: '30px', objectFit: 'cover', cursor: 'pointer' }}
                    />
                  ) : (
                    <span
                      onClick={() => handlePickImage(wine.id)}
                      style={{ fontSize: '12px', color: COLORS.textMuted, cursor: 'pointer' }}
                    >
                      + Lisää kuva
                    </span>
                  )}
                </div>
                <BottleManager wineId={wine.id} />
              </>
            )}
          </div>
        ))}

        {addingVintage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="number"
              placeholder="Vuosikerta"
              value={newVintage}
              onChange={(e) => setNewVintage(e.target.value)}
              style={vintageInputStyle}
            />
            <span onClick={handleAddVintage} style={linkStyle}>
              Tallenna
            </span>
            <span
              onClick={() => {
                setAddingVintage(false)
                setNewVintage('')
              }}
              style={linkStyle}
            >
              Peruuta
            </span>
          </div>
        ) : (
          <span onClick={() => setAddingVintage(true)} style={linkStyle}>
            + Lisää vuosikerta
          </span>
        )}
      </div>
    </div>
  )
}
