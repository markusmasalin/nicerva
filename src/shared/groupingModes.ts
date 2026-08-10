import type { Wine } from '../features/wines'
import type { LanguageCode } from './countries'
import { getCountryName } from './countries'
import { TRANSLATIONS, type TranslationKey } from './translations'

export type GroupingMode = 'appellation' | 'producer' | 'price'

// Price-tason key-funktio tarvitsee averagePrices-datan, jota pelkkä
// Wine-olio ei sisällä — muut tasot eivät käytä tätä lainkaan.
export type GroupContext = {
  averagePrices: Record<string, number>
}

export type GroupLevel = {
  key: (wine: Wine, context?: GroupContext) => string
  label: (key: string, language: LanguageCode) => string
}

function translate(language: LanguageCode, key: TranslationKey): string {
  return TRANSLATIONS[language][key] ?? TRANSLATIONS.fi[key] ?? key
}

// Appellaatio- ja tuottajanäkymät jakavat saman maa→alue-henkarin.
const COUNTRY_LEVEL: GroupLevel = { key: (wine) => wine.country, label: (key, language) => getCountryName(key, language) }
const REGION_LEVEL: GroupLevel = { key: (wine) => wine.region, label: (key) => key }

function appellationKey(wine: Wine): string {
  return wine.appellation?.trim() || ''
}

function appellationLabel(key: string, language: LanguageCode): string {
  return key || translate(language, 'grouping_other')
}

const appellationLevels: GroupLevel[] = [COUNTRY_LEVEL, REGION_LEVEL, { key: appellationKey, label: appellationLabel }]

const producerLevels: GroupLevel[] = [COUNTRY_LEVEL, REGION_LEVEL, { key: (wine) => wine.producer, label: (key) => key }]

const PRICE_UNDER_20 = 'under_20'
const PRICE_20_TO_50 = '20_50'
const PRICE_50_TO_100 = '50_100'
const PRICE_OVER_100 = 'over_100'
const PRICE_UNKNOWN = 'unknown'

const PRICE_BUCKET_LABEL_KEYS: Record<string, TranslationKey> = {
  [PRICE_UNDER_20]: 'price_bucket_under_20',
  [PRICE_20_TO_50]: 'price_bucket_20_to_50',
  [PRICE_50_TO_100]: 'price_bucket_50_to_100',
  [PRICE_OVER_100]: 'price_bucket_over_100',
  [PRICE_UNKNOWN]: 'price_bucket_unknown',
}

function priceBucketKey(wine: Wine, context?: GroupContext): string {
  const price = context?.averagePrices[wine.id]
  if (price == null) return PRICE_UNKNOWN
  if (price < 20) return PRICE_UNDER_20
  if (price < 50) return PRICE_20_TO_50
  if (price < 100) return PRICE_50_TO_100
  return PRICE_OVER_100
}

function priceBucketLabel(key: string, language: LanguageCode): string {
  return translate(language, PRICE_BUCKET_LABEL_KEYS[key] ?? 'price_bucket_unknown')
}

const priceLevels: GroupLevel[] = [{ key: priceBucketKey, label: priceBucketLabel }]

export const GROUP_LEVELS: Record<GroupingMode, GroupLevel[]> = {
  appellation: appellationLevels,
  producer: producerLevels,
  price: priceLevels,
}
