import type { CSSProperties } from 'react'
import type { WineFilterParams } from '../types'
import { COLORS } from '../../../shared/colors'

const fieldStyle: CSSProperties = {
  border: 'none',
  borderBottom: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.text,
  colorScheme: 'light',
  fontSize: '14px',
  padding: '6px 2px',
}

type Props = {
  filters: WineFilterParams
  onChange: (filters: WineFilterParams) => void
}

export function WineFilters({ filters, onChange }: Props) {
  function updateText(key: keyof WineFilterParams, value: string) {
    onChange({ ...filters, [key]: value || undefined })
  }

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <input
        placeholder="Hae nimellä..."
        value={filters.search ?? ''}
        onChange={(e) => updateText('search', e.target.value)}
        style={fieldStyle}
      />
      <input
        placeholder="Maa"
        value={filters.country ?? ''}
        onChange={(e) => updateText('country', e.target.value)}
        style={fieldStyle}
      />
      <input
        placeholder="Alue"
        value={filters.region ?? ''}
        onChange={(e) => updateText('region', e.target.value)}
        style={fieldStyle}
      />
      <input
        placeholder="Rypäle"
        value={filters.grape ?? ''}
        onChange={(e) => updateText('grape', e.target.value)}
        style={fieldStyle}
      />
      <input
        placeholder="Vuosikerta"
        type="number"
        value={filters.vintage ?? ''}
        onChange={(e) =>
          onChange({ ...filters, vintage: e.target.value ? Number(e.target.value) : undefined })
        }
        style={fieldStyle}
      />
    </div>
  )
}
