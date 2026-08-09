import type { CSSProperties } from 'react'
import type { Bottle, BottleStatus } from '../types'
import { COLORS } from '../../../shared/colors'
import { useTranslation } from '../../../app/LanguageContext'

const linkStyle: CSSProperties = {
  fontSize: '12px',
  color: COLORS.textMuted,
  cursor: 'pointer',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '6px 0',
  fontSize: '13px',
  color: COLORS.textMuted,
}

type Props = {
  bottles: Bottle[]
  editMode: boolean
  onEdit: (bottle: Bottle) => void
  onOpenBottle: (bottle: Bottle) => void
}

export function BottleList({ bottles, editMode, onEdit, onOpenBottle }: Props) {
  const t = useTranslation()
  const statusLabels: Record<BottleStatus, string> = {
    cellar: t('bottle_status_cellar'),
    consumed: t('bottle_status_consumed'),
    gifted: t('bottle_status_gifted'),
  }

  if (bottles.length === 0) {
    return <p>Ei vielä pulloja tälle viinille.</p>
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {bottles.map((bottle) => (
        <li key={bottle.id} className="bottle-row" style={rowStyle}>
          <span style={{ flex: 1, color: COLORS.text }}>{bottle.location ?? '-'}</span>
          <span style={{ width: '60px' }}>{bottle.purchasePrice != null ? `${bottle.purchasePrice} €` : '-'}</span>
          <span style={{ width: '110px' }}>{bottle.purchaseDate ?? '-'}</span>
          <span style={{ width: '90px' }}>{statusLabels[bottle.status]}</span>
          <span style={{ flex: 1 }}>{bottle.note ?? ''}</span>
          {bottle.status === 'cellar' && (
            <span onClick={() => onOpenBottle(bottle)} style={linkStyle}>
              🍾 Avaa pullo
            </span>
          )}
          {editMode && (
            <span onClick={() => onEdit(bottle)} style={linkStyle}>
              Muokkaa
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
