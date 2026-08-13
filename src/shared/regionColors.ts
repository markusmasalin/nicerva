import { normalizeText } from './normalizeText'

export const REGION_FALLBACK_COLORS: Record<string, string> = {
  piemonte: '#D8D1B8',
  valledaosta: '#C7C9B8',
  lombardia: '#D2C7A8',
  trentinoaltoadige: '#C5CBB9',
  veneto: '#D8C3A5',
  friuliveneziagiulia: '#C5C9B5',
  liguria: '#C8C7B0',
  emiliaromagna: '#D2B99A',
  toscana: '#D7C4A0',
  umbria: '#C6C1A5',
  marche: '#C9C7B2',
  lazio: '#D1BFA5',
  abruzzo: '#BFC5B0',
  molise: '#C8BDA1',
  campania: '#D2B18F',
  puglia: '#DDD0A7',
  basilicata: '#BDB49B',
  calabria: '#C9B89C',
  sicilia: '#D0B18A',
  sardinia: '#C5BDA2',
}

export function getRegionFallbackColor(region: string): string | null {
  return REGION_FALLBACK_COLORS[normalizeText(region)] ?? null
}
