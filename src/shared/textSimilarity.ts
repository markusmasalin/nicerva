// Yleiset tuottajan etuliitteet, jotka poistetaan ennen vertailua —
// esim. "Tenuta San Guido" ja "San Guido" pitäisi tunnistaa samaksi.
const PRODUCER_PREFIXES = ['azienda agricola', 'tenuta', 'cantina', 'domaine', 'chateau', 'podere']

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalize(value: string): string {
  const normalized = stripDiacritics(value.trim().toLowerCase())
  for (const prefix of PRODUCER_PREFIXES) {
    if (normalized.startsWith(prefix + ' ')) {
      return normalized.slice(prefix.length).trim()
    }
  }
  return normalized
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0))

  for (let i = 0; i < rows; i++) matrix[i][0] = i
  for (let j = 0; j < cols; j++) matrix[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // poisto
        matrix[i][j - 1] + 1, // lisäys
        matrix[i - 1][j - 1] + cost, // korvaus
      )
    }
  }

  return matrix[rows - 1][cols - 1]
}

// Palauttaa 0-1 välisen samankaltaisuusarvon (1 = identtinen) Levenshtein-
// etäisyyteen perustuen, normalisoituna merkkijonojen pituudella.
export function similarity(a: string, b: string): number {
  const normalizedA = normalize(a)
  const normalizedB = normalize(b)

  if (normalizedA === normalizedB) return 1

  const maxLength = Math.max(normalizedA.length, normalizedB.length)
  if (maxLength === 0) return 1

  const distance = levenshteinDistance(normalizedA, normalizedB)
  return Math.max(0, 1 - distance / maxLength)
}
