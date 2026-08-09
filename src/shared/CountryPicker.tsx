import type { CSSProperties } from 'react'
import { COUNTRIES, getCountryName } from './countries'
import { FIELD_STYLE } from './fieldStyles'
import { useLanguage } from '../app/LanguageContext'

type Props = {
  value: string | null
  onChange: (code: string | null) => void
  allowEmpty?: boolean
  required?: boolean
  style?: CSSProperties
}

export function CountryPicker({ value, onChange, allowEmpty, required, style }: Props) {
  const language = useLanguage()
  const codes = Object.keys(COUNTRIES)
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      required={required}
      style={style ?? FIELD_STYLE}
    >
      {allowEmpty && <option value="">—</option>}
      {codes.map((code) => (
        <option key={code} value={code}>
          {getCountryName(code, language)}
        </option>
      ))}
    </select>
  )
}
