import type { CSSProperties } from 'react'
import type { WineFilterParams } from '../types'
import { COLORS } from '../../../shared/colors'
import { useTranslation } from '../../../app/LanguageContext'
import { CountryPicker } from '../../../shared/CountryPicker'

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
  hideSearch?: boolean
}

export function WineFilters({ filters, onChange, hideSearch }: Props) {
  const t = useTranslation()

  function updateText(key: keyof WineFilterParams, value: string) {
    onChange({ ...filters, [key]: value || undefined })
  }

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {!hideSearch && (
        <input
          placeholder={t('filters_search_placeholder')}
          value={filters.search ?? ''}
          onChange={(e) => updateText('search', e.target.value)}
          style={fieldStyle}
        />
      )}
      <CountryPicker
        value={filters.country ?? null}
        onChange={(code) => onChange({ ...filters, country: code ?? undefined })}
        allowEmpty
        style={fieldStyle}
      />
      <input
        placeholder={t('filters_region_placeholder')}
        value={filters.region ?? ''}
        onChange={(e) => updateText('region', e.target.value)}
        style={fieldStyle}
      />
      <input
        placeholder={t('wine_appellation_placeholder')}
        value={filters.appellation ?? ''}
        onChange={(e) => updateText('appellation', e.target.value)}
        style={fieldStyle}
      />
      <input
        placeholder={t('filters_grape_placeholder')}
        value={filters.grape ?? ''}
        onChange={(e) => updateText('grape', e.target.value)}
        style={fieldStyle}
      />
      <input
        placeholder={t('filters_vintage_placeholder')}
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
