import type { LanguageCode } from './countries'

export const TAG_LABELS: Record<string, Record<LanguageCode, string>> = {
  fruity: { fi: 'Hedelmäinen', en: 'Fruity', it: 'Fruttato' },
  elegant: { fi: 'Elegantti', en: 'Elegant', it: 'Elegante' },
  silky: { fi: 'Silkkinen', en: 'Silky', it: 'Setoso' },
  acidic: { fi: 'Hapokas', en: 'Acidic', it: 'Acido' },
  tannic: { fi: 'Tanniininen', en: 'Tannic', it: 'Tannico' },
  full_bodied: { fi: 'Täyteläinen', en: 'Full-bodied', it: 'Corposo' },
  spicy: { fi: 'Mausteinen', en: 'Spicy', it: 'Speziato' },
  mineral: { fi: 'Mineraalinen', en: 'Mineral', it: 'Minerale' },
  balanced: { fi: 'Tasapainoinen', en: 'Balanced', it: 'Equilibrato' },
  would_buy_again: { fi: 'Ostaisin uudelleen', en: 'Would buy again', it: 'Lo ricomprerei' },

  smoky: { fi: 'Savuinen', en: 'Smoky', it: 'Affumicato' },
  leathery: { fi: 'Nahkainen', en: 'Leathery', it: 'Cuoio' },
  floral: { fi: 'Kukkainen', en: 'Floral', it: 'Floreale' },
  nutty: { fi: 'Pähkinäinen', en: 'Nutty', it: 'Nocciolato' },
  vanilla: { fi: 'Vaniljainen', en: 'Vanilla', it: 'Vaniglia' },
  tart: { fi: 'Kirpeä', en: 'Tart', it: 'Aspro' },
  berry: { fi: 'Marjainen', en: 'Berry', it: 'Fruttato di bosco' },
  citrus: { fi: 'Sitruksinen', en: 'Citrus', it: 'Agrumato' },
  ripe: { fi: 'Kypsä', en: 'Ripe', it: 'Maturo' },
  earthy: { fi: 'Maanläheinen', en: 'Earthy', it: 'Terroso' },
  herbal: { fi: 'Yrttinen', en: 'Herbal', it: 'Erbaceo' },
  peppery: { fi: 'Pippurinen', en: 'Peppery', it: 'Pepato' },
  oaky: { fi: 'Tammileimallinen', en: 'Oaky', it: 'Legnoso' },
  soft: { fi: 'Pehmeä', en: 'Soft', it: 'Morbido' },
  dry: { fi: 'Kuiva', en: 'Dry', it: 'Secco' },
  sweet: { fi: 'Makea', en: 'Sweet', it: 'Dolce' },
  fresh: { fi: 'Raikas', en: 'Fresh', it: 'Fresco' },
  rich: { fi: 'Runsas', en: 'Rich', it: 'Ricco' },
  light: { fi: 'Kevyt', en: 'Light', it: 'Leggero' },
  rustic: { fi: 'Rustiikkinen', en: 'Rustic', it: 'Rustico' },
  firm: { fi: 'Jämäkkä', en: 'Firm', it: 'Deciso' },
  smooth: { fi: 'Sileä', en: 'Smooth', it: 'Levigato' },
  aromatic: { fi: 'Aromikas', en: 'Aromatic', it: 'Aromatico' },
  cherry: { fi: 'Kirsikkainen', en: 'Cherry', it: 'Ciliegia' },
  plum: { fi: 'Luumuinen', en: 'Plum', it: 'Prugna' },
  blackcurrant: { fi: 'Mustaherukkainen', en: 'Blackcurrant', it: 'Ribes nero' },
  raspberry: { fi: 'Vadelmainen', en: 'Raspberry', it: 'Lampone' },
  orange_peel: { fi: 'Appelsiininen', en: 'Orange peel', it: 'Buccia d\'arancia' },
  peachy: { fi: 'Persikkainen', en: 'Peachy', it: 'Pesca' },
  appley: { fi: 'Omenainen', en: 'Appley', it: 'Mela' },
}

export function getTagLabel(key: string, lang: LanguageCode): string {
  return TAG_LABELS[key]?.[lang] ?? key
}

export const FOOD_PAIRING_LABELS: Record<string, Record<LanguageCode, string>> = {
  steak: { fi: 'Pihvi', en: 'Steak', it: 'Bistecca' },
  cheese: { fi: 'Juusto', en: 'Cheese', it: 'Formaggio' },
  pasta: { fi: 'Pasta', en: 'Pasta', it: 'Pasta' },
  mushroom: { fi: 'Sienet', en: 'Mushroom', it: 'Funghi' },
  fish: { fi: 'Kala', en: 'Fish', it: 'Pesce' },
  pizza: { fi: 'Pizza', en: 'Pizza', it: 'Pizza' },
}

export function getFoodPairingLabel(key: string, lang: LanguageCode): string {
  return FOOD_PAIRING_LABELS[key]?.[lang] ?? key
}
