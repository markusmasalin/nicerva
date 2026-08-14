import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { COLORS } from './colors'
import { useTranslation } from '../app/LanguageContext'

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
  overscrollBehavior: 'contain',
  boxSizing: 'border-box',
}

// Yleiskäyttöinen modaalikuori. Korvaa inline-lomakkeet kaikkialla
// sovelluksessa — kohdennetut muokkausmodaalit rakentuvat tämän päälle.
export function Modal({ title, onClose, children }: Props) {
  const t = useTranslation()

  useEffect(() => {
    const scrollY = window.scrollY
    const body = document.body
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  return createPortal(
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={cardStyle}>
        <span onClick={onClose} style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}>
          ← {t('common_back')}
        </span>
        <h2 style={{ margin: '12px 0 20px', fontSize: '1.2rem', fontWeight: 400, color: COLORS.text }}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}
