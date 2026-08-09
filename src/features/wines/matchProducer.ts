import { normalizeText } from '../../shared/normalizeText'
import type { Producer } from '../producers'

// Sama periaate kuin findKnownAppellation: normalisoi tunnistetun raakatekstin
// yhdeksi merkkijonoksi ja etsii pisimmän osuman — nyt jokaisen producerin
// name JA jokaisen aliases-alkion normalisoituna. Pisin osuma voittaa,
// tasapelissä ensimmäinen listajärjestyksessä.
export function findKnownProducer(detectedText: string[], producers: Producer[]): Producer | null {
  const combined = normalizeText(detectedText.join(' '))

  let best: Producer | null = null
  let bestLength = 0

  for (const producer of producers) {
    const candidates = [producer.name, ...producer.aliases]
    for (const candidate of candidates) {
      const normalizedCandidate = normalizeText(candidate)
      if (normalizedCandidate.length === 0) continue
      if (combined.includes(normalizedCandidate) && normalizedCandidate.length > bestLength) {
        best = producer
        bestLength = normalizedCandidate.length
      }
    }
  }

  return best
}
