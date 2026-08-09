import { useState } from 'react'
import { useBottlesForWine } from '../useInventory'
import { BottleList } from './BottleList'
import type { Bottle } from '../types'
import { BottleEditModal } from '../../../app/BottleEditModal'
import { TastingModal } from '../../../app/TastingModal'
import { COLORS } from '../../../shared/colors'
import { useTranslation } from '../../../app/LanguageContext'

type Props = { wineId: string; editMode: boolean }

type ModalState = { mode: 'edit'; bottle: Bottle } | { mode: 'create' } | null

export function BottleManager({ wineId, editMode }: Props) {
  const t = useTranslation()
  const [modalState, setModalState] = useState<ModalState>(null)
  const [tastingBottle, setTastingBottle] = useState<Bottle | null>(null)
  const { data: bottles = [], isLoading } = useBottlesForWine(wineId)

  return (
    <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #ddd', marginBottom: '0.5rem' }}>
      {isLoading ? (
        <p>Ladataan pulloja...</p>
      ) : (
        <BottleList
          bottles={bottles}
          editMode={editMode}
          onEdit={(bottle) => setModalState({ mode: 'edit', bottle })}
          onOpenBottle={(bottle) => setTastingBottle(bottle)}
        />
      )}
      {editMode && (
        <button
          onClick={() => setModalState({ mode: 'create' })}
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
          + {t('bottle_add_link')}
        </button>
      )}

      {modalState && (
        <BottleEditModal
          mode={modalState.mode}
          wineId={wineId}
          bottle={modalState.mode === 'edit' ? modalState.bottle : undefined}
          onClose={() => setModalState(null)}
        />
      )}

      {tastingBottle && <TastingModal bottle={tastingBottle} onClose={() => setTastingBottle(null)} />}
    </div>
  )
}
