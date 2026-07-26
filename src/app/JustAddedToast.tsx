import { COLORS } from '../shared/colors'
import { WINE_TYPE_COLORS } from '../shared/wineTypeColors'
import { BottleIcon } from '../shared/BottleIcon'

type Props = {
  name: string
  type: string
}

export function JustAddedToast({ name, type }: Props) {
  const bottleColor = WINE_TYPE_COLORS[type] ?? COLORS.textMuted

  return (
    <>
      <style>{`
        @keyframes just-added-toast {
          0% { opacity: 0; transform: translate(-50%, 12px); }
          8% { opacity: 1; transform: translate(-50%, 0); }
          88% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, 0); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          background: COLORS.bg,
          border: `1px solid ${COLORS.line}`,
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          color: COLORS.text,
          animation: 'just-added-toast 2500ms ease forwards',
          zIndex: 200,
        }}
      >
        <span style={{ color: bottleColor, display: 'flex' }}>
          <BottleIcon />
        </span>
        <span>{name} lisätty kokoelmaan</span>
      </div>
    </>
  )
}
