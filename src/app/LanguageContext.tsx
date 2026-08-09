import { createContext, useContext, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { LanguageCode } from '../shared/countries'
import { TRANSLATIONS, type TranslationKey } from '../shared/translations'

const SUPPORTED_LANGUAGES: LanguageCode[] = ['fi', 'en', 'it']

function resolveLanguage(session: Session | null): LanguageCode {
  const raw = session?.user.user_metadata?.language
  return SUPPORTED_LANGUAGES.includes(raw as LanguageCode) ? (raw as LanguageCode) : 'fi'
}

const LanguageContext = createContext<LanguageCode>('fi')

type Props = {
  session: Session | null
  children: ReactNode
}

// Kieli luetaan suoraan session.user.user_metadata:sta (osa Supabasen
// auth.users-riviä), ei erillistä tilaa eikä localStoragea — kieli
// seuraa käyttäjää laitteesta riippumatta.
export function LanguageProvider({ session, children }: Props) {
  return <LanguageContext.Provider value={resolveLanguage(session)}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageCode {
  return useContext(LanguageContext)
}

export function useTranslation() {
  const language = useLanguage()
  return function t(key: TranslationKey): string {
    return TRANSLATIONS[language][key] ?? TRANSLATIONS.fi[key] ?? key
  }
}
