import { COLORS } from './colors'
import { mixWithWhite } from './mixColor'

export const WINE_TYPE_COLORS: Record<string, string> = {
  red: COLORS.wineRed,
  white: '#D9D3C4',
  rose: '#C98F8F',
  sparkling: '#B8B8A8',
  dessert: '#A8823D',
  fortified: '#7A4B3A',
}

export function getWineTypeCardBackground(type: string): string {
  return mixWithWhite(WINE_TYPE_COLORS[type] ?? COLORS.textMuted)
}
