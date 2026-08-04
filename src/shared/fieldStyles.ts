import { COLORS } from './colors'

// Vakiotyylit isoille lomakekentille. Käytä näitä kaikissa modaalilomakkeissa
// (WineIdentityModal, VintageModal, BottleEditModal, WineForm) yhtenäisen,
// nykyistä isomman kenttäkoon takaamiseksi.
export const FIELD_STYLE = {
  fontSize: '18px',
  padding: '12px 14px',
  border: '1px solid ' + COLORS.line,
  borderRadius: '8px',
  background: '#FFFFFF',
  width: '100%',
  boxSizing: 'border-box' as const,
  colorScheme: 'light' as const,
  color: COLORS.text,
}

export const FIELD_LABEL_STYLE = {
  fontSize: '13px',
  color: COLORS.textMuted,
  marginBottom: '6px',
}
