export type LanguageCode = 'fi' | 'en' | 'it'

export const COUNTRIES: Record<string, Record<LanguageCode, string>> = {
  IT: { fi: 'Italia', en: 'Italy', it: 'Italia' },
  FR: { fi: 'Ranska', en: 'France', it: 'Francia' },
  ES: { fi: 'Espanja', en: 'Spain', it: 'Spagna' },
  DE: { fi: 'Saksa', en: 'Germany', it: 'Germania' },
  US: { fi: 'Yhdysvallat', en: 'United States', it: 'Stati Uniti' },
  CL: { fi: 'Chile', en: 'Chile', it: 'Cile' },
  AR: { fi: 'Argentiina', en: 'Argentina', it: 'Argentina' },
  PT: { fi: 'Portugali', en: 'Portugal', it: 'Portogallo' },
  AT: { fi: 'Itävalta', en: 'Austria', it: 'Austria' },
  CH: { fi: 'Sveitsi', en: 'Switzerland', it: 'Svizzera' },
  NZ: { fi: 'Uusi-Seelanti', en: 'New Zealand', it: 'Nuova Zelanda' },
  AU: { fi: 'Australia', en: 'Australia', it: 'Australia' },
  ZA: { fi: 'Etelä-Afrikka', en: 'South Africa', it: 'Sudafrica' },
}

export function getCountryName(code: string, lang: LanguageCode): string {
  return COUNTRIES[code]?.[lang] ?? code
}

// Käytetään VAIN kertaluontoisessa migraatiossa vanhan suomenkielisen
// tekstidatan muuntamiseen koodeiksi, ei uudessa koodissa muuten.
export const LEGACY_FINNISH_TO_CODE: Record<string, string> = {
  italia: 'IT',
  ranska: 'FR',
  espanja: 'ES',
  saksa: 'DE',
  usa: 'US',
}
