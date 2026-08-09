import { fi } from './fi'
import { en } from './en'
import { it } from './it'
import type { LanguageCode } from '../countries'

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = { fi, en, it }
export type TranslationKey = keyof typeof fi
