import { KNOWN_APPELLATIONS, type KnownAppellation } from './knownAppellations'

// Yhdistää tunnistetun raakatekstin yhdeksi merkkijonoksi ja etsii siitä
// tunnetun appellaatiolistan pisimmän osuman (osamerkkijonona,
// kirjainkoosta riippumatta). Pisin osuma voittaa, koska se on tyypillisesti
// tarkin (esim. "Barbera d'Asti Superiore DOCG" ennen "Barbera d'Asti DOCG").
export function findKnownAppellation(detectedText: string[]): KnownAppellation | null {
  const combined = detectedText.join(' ').toLowerCase()

  let best: KnownAppellation | null = null
  for (const appellation of KNOWN_APPELLATIONS) {
    if (combined.includes(appellation.name.toLowerCase())) {
      if (!best || appellation.name.length > best.name.length) {
        best = appellation
      }
    }
  }
  return best
}
