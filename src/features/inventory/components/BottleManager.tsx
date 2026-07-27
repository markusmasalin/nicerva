import { useState } from 'react'
import { useBottlesForWine, useCreateBottle, useUpdateBottle, useDeleteBottle } from '../useInventory'
import { BottleForm } from './BottleForm'
import { BottleList } from './BottleList'
import type { BottleStatus } from '../types'
import { COLORS } from '../../../shared/colors'

type Props = { wineId: string; editMode: boolean }

export function BottleManager({ wineId, editMode }: Props) {
  const [showForm, setShowForm] = useState(false)
  const { data: bottles = [], isLoading } = useBottlesForWine(wineId)
  const createBottle = useCreateBottle()
  const updateBottle = useUpdateBottle()
  const deleteBottle = useDeleteBottle()

  function handleStatusChange(id: string, status: BottleStatus) {
    const bottle = bottles.find((b) => b.id === id)
    if (!bottle) return
    updateBottle.mutate({
      id,
      bottle: {
        wineId: bottle.wineId,
        purchasePrice: bottle.purchasePrice,
        purchaseDate: bottle.purchaseDate,
        location: bottle.location,
        note: bottle.note,
        status,
      },
    })
  }

  function handleFieldUpdate(
    id: string,
    field: 'location' | 'purchasePrice' | 'purchaseDate' | 'note',
    value: string | number | null,
  ) {
    const bottle = bottles.find((b) => b.id === id)
    if (!bottle) return
    updateBottle.mutate({
      id,
      bottle: {
        wineId: bottle.wineId,
        purchasePrice: bottle.purchasePrice,
        purchaseDate: bottle.purchaseDate,
        location: bottle.location,
        note: bottle.note,
        status: bottle.status,
        [field]: value,
      },
    })
  }

  return (
    <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #ddd', marginBottom: '0.5rem' }}>
      {isLoading ? (
        <p>Ladataan pulloja...</p>
      ) : (
        <BottleList
          bottles={bottles}
          onUpdateStatus={handleStatusChange}
          onUpdateField={handleFieldUpdate}
          onDelete={(id) => deleteBottle.mutate(id)}
          editMode={editMode}
        />
      )}
      {editMode &&
        (showForm ? (
          <BottleForm
            wineId={wineId}
            onSubmit={(bottle) => {
              createBottle.mutate(bottle)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            style={{
              border: 'none',
              background: 'transparent',
              color: COLORS.textMuted,
              fontSize: '13px',
              padding: '4px 0',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            + Lisää pullo
          </button>
        ))}
    </div>
  )
}
