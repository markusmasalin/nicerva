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

  bordeaux: '#6E2638',
  bourgogne: '#4B2948',
  champagne: '#B49A62',
  alsace: '#3F6653',
  provence: '#786A91',
  loire: '#71835D',
  rhone: '#9A513D',
}

export function getRegionFallbackColor(region: string): string | null {
  return REGION_FALLBACK_COLORS[normalizeText(region)] ?? null
}

// Maakohtainen keskitaso RegionFallbackColorin (alue-spesifi) ja
// COUNTRY_FLAG_COLORS:n (lippu-pohjainen) välissä — kattaa maat joilla ei
// vielä ole alue-spesifisiä sävyjä mutta joille lippuvärit sopisivat huonosti
// kortin taustaksi.
export const COUNTRY_FALLBACK_COLORS: Record<string, string> = {
  FR: '#304C6D',
}

export function getCountryFallbackColor(country: string): string | null {
  return COUNTRY_FALLBACK_COLORS[country] ?? null
}
