import { useState, type CSSProperties, type ReactNode } from 'react'
import { COLORS } from '../shared/colors'

export type TierOption = {
  value: string
  label: string
}

type Props = {
  icon: ReactNode
  currentTier: string | null
  // Järjestyksessä ylimmästä alimmasta tasosta — sama järjestys näkyy valikossa.
  options: TierOption[]
  removeLabel: string
  onSelect: (tier: string | null) => void
}

const triggerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  padding: '4px',
  cursor: 'pointer',
}

const menuCardStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  minWidth: '200px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  background: COLORS.bg,
  border: `1px solid ${COLORS.line}`,
  borderRadius: '8px',
  padding: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
  zIndex: 120,
}

const menuItemStyle: CSSProperties = {
  fontSize: '13px',
  cursor: 'pointer',
  padding: '8px 12px',
  borderRadius: '6px',
  whiteSpace: 'nowrap',
}

// Geneerinen kolmiportainen taso-valikko — sekä suosikki- (Aarre/Timantti/
// Legenda) että wishlist-tasot (Toivelistalla/Priorisoitu/Etsintäkuulutus)
// käyttävät tätä samaa komponenttia, vain options/icon/removeLabel vaihtuvat.
export function TierMenu({ icon, currentTier, options, removeLabel, onSelect }: Props) {
  const [open, setOpen] = useState(false)

  function handleSelect(tier: string | null) {
    onSelect(tier)
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{ ...triggerStyle, color: currentTier != null ? COLORS.text : COLORS.textMuted }}
      >
        {icon}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 110 }} />
          <div onClick={(e) => e.stopPropagation()} style={menuCardStyle}>
            {options.map((option) => {
              const selected = currentTier === option.value
              return (
                <span
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  style={{
                    ...menuItemStyle,
                    color: selected ? COLORS.bg : COLORS.text,
                    background: selected ? COLORS.text : 'transparent',
                  }}
                >
                  {option.label}
                </span>
              )
            })}
            {currentTier != null && (
              <span onClick={() => handleSelect(null)} style={{ ...menuItemStyle, color: COLORS.textMuted }}>
                {removeLabel}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
