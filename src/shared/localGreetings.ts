export const LOCAL_GREETINGS: Record<string, string> = {
  italia: 'Cin cin!',
  ranska: 'Santé !',
  espanja: '¡Salud!',
  saksa: 'Prost!',
  portugali: 'Saúde!',
}
export const DEFAULT_GREETING = 'Cheers!'

export function getLocalGreeting(country: string | null): string {
  if (!country) return DEFAULT_GREETING
  return LOCAL_GREETINGS[country.trim().toLowerCase()] ?? DEFAULT_GREETING
}

// Sama avainjoukko kuin LOCAL_GREETINGS — helppo päätellä koska maa on jo
// suomenkielisenä nimenä, ei ISO-koodina.
const COUNTRY_FLAGS: Record<string, string> = {
  italia: '🇮🇹',
  ranska: '🇫🇷',
  espanja: '🇪🇸',
  saksa: '🇩🇪',
  portugali: '🇵🇹',
}

export function getCountryFlag(country: string | null): string | null {
  if (!country) return null
  return COUNTRY_FLAGS[country.trim().toLowerCase()] ?? null
}
