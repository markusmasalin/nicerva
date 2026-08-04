import type { CSSProperties, ReactNode } from 'react'
import { COLORS } from './colors'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
  padding: '16px',
}

const cardStyle: CSSProperties = {
  background: COLORS.bg,
  color: COLORS.text,
  borderRadius: '12px',
  padding: '24px',
  width: '100%',
  maxWidth: '420px',
  maxHeight: '85vh',
  overflowY: 'auto',
  boxSizing: 'border-box',
}

// Yleiskäyttöinen modaalikuori. Korvaa inline-lomakkeet kaikkialla
// sovelluksessa — kohdennetut muokkausmodaalit rakentuvat tämän päälle.
export function Modal({ title, onClose, children }: Props) {
  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={cardStyle}>
        <span onClick={onClose} style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>
          ← Takaisin
        </span>
        <h2 style={{ margin: '12px 0 20px', fontSize: '1.2rem', fontWeight: 400, color: COLORS.text }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
