import { useState, type CSSProperties } from 'react'
import type { Bottle, BottleStatus } from '../types'
import { COLORS } from '../../../shared/colors'

const STATUS_LABELS: Record<BottleStatus, string> = {
  cellar: 'Kellarissa',
  consumed: 'Juotu',
  gifted: 'Lahjoitettu',
}

const fieldStyle: CSSProperties = {
  border: 'none',
  borderBottom: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  padding: '2px 0',
  fontSize: '13px',
  colorScheme: 'light',
}

const selectStyle: CSSProperties = {
  ...fieldStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
}

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
  onUpdateStatus: (id: string, status: BottleStatus) => void
  onUpdateField: (
    id: string,
    field: 'location' | 'purchasePrice' | 'purchaseDate' | 'note',
    value: string | number | null,
  ) => void
  onDelete: (id: string) => void
}

export function BottleList({ bottles, onUpdateStatus, onUpdateField, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (bottles.length === 0) {
    return <p>Ei vielä pulloja tälle viinille.</p>
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {bottles.map((bottle) =>
        bottle.id === editingId ? (
          <li key={bottle.id} className="bottle-row" style={rowStyle}>
            <input
              type="text"
              defaultValue={bottle.location ?? ''}
              onBlur={(e) => onUpdateField(bottle.id, 'location', e.target.value === '' ? null : e.target.value)}
              style={{ ...fieldStyle, flex: 1, color: COLORS.text }}
            />
            <input
              type="number"
              step="0.01"
              defaultValue={bottle.purchasePrice ?? ''}
              onBlur={(e) =>
                onUpdateField(
                  bottle.id,
                  'purchasePrice',
                  e.target.value === '' ? null : parseFloat(e.target.value),
                )
              }
              style={{ ...fieldStyle, width: '60px' }}
            />
            <input
              type="date"
              defaultValue={bottle.purchaseDate ?? ''}
              onBlur={(e) => onUpdateField(bottle.id, 'purchaseDate', e.target.value === '' ? null : e.target.value)}
              style={{ ...fieldStyle, width: '110px' }}
            />
            <select
              value={bottle.status}
              onChange={(e) => onUpdateStatus(bottle.id, e.target.value as BottleStatus)}
              style={{ ...selectStyle, width: '90px' }}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="text"
              defaultValue={bottle.note ?? ''}
              onBlur={(e) => onUpdateField(bottle.id, 'note', e.target.value === '' ? null : e.target.value)}
              style={{ ...fieldStyle, flex: 1 }}
            />
            <span onClick={() => setEditingId(null)} style={linkStyle}>
              Valmis
            </span>
          </li>
        ) : (
          <li key={bottle.id} className="bottle-row" style={rowStyle}>
            <span style={{ flex: 1, color: COLORS.text }}>{bottle.location ?? '-'}</span>
            <span style={{ width: '60px' }}>{bottle.purchasePrice != null ? `${bottle.purchasePrice} €` : '-'}</span>
            <span style={{ width: '110px' }}>{bottle.purchaseDate ?? '-'}</span>
            <span style={{ width: '90px' }}>{STATUS_LABELS[bottle.status]}</span>
            <span style={{ flex: 1 }}>{bottle.note ?? ''}</span>
            <span onClick={() => setEditingId(bottle.id)} style={linkStyle}>
              Muokkaa
            </span>
            <span onClick={() => onDelete(bottle.id)} style={linkStyle}>
              Poista
            </span>
          </li>
        ),
      )}
    </ul>
  )
}
