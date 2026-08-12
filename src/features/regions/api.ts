import { supabase } from '../../lib/supabase'
import { normalizeText } from '../../shared/normalizeText'

const BUCKET = 'region-photos'
const EXTENSIONS = ['jpg', 'png', 'webp']

// Hakee korin sisällön KERRAN ja palauttaa TÄYDET tiedostonimet päätteineen
// (esim. "piemonte.jpg") Set:inä nopeaa jäsenyystarkistusta varten —
// resolveRegionPhotoUrl kokeilee useaa päätettä, joten manifestin täytyy
// sisältää täydet nimet jotta .has() täsmää. Piilotiedostot (esim. Supabasen
// automaattisesti luoma .emptyFolderPlaceholder tyhjässä korissa) suodatetaan pois.
export async function getRegionPhotoManifest(): Promise<Set<string>> {
  const { data, error } = await supabase.storage.from(BUCKET).list()
  if (error) throw error

  const names = (data ?? []).filter((file) => !file.name.startsWith('.')).map((file) => file.name)
  return new Set(names)
}

function getPublicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Alue-kuva on tarkempi osuma kuin maa-kuva, joten sitä kokeillaan ensin,
// eri päätteet järjestyksessä. country on ISO-koodi sellaisenaan
// (ei normalizeText:iä), koska tiedostonimet korissa vastaavat suoraan
// wines.country-arvoa.
export function resolveRegionPhotoUrl(country: string, region: string, manifest: Set<string>): string | null {
  const regionKey = normalizeText(region)
  const countryKey = country

  for (const ext of EXTENSIONS) {
    if (manifest.has(`${regionKey}.${ext}`)) {
      return getPublicUrl(`${regionKey}.${ext}`)
    }
  }
  for (const ext of EXTENSIONS) {
    if (manifest.has(`${countryKey}.${ext}`)) {
      return getPublicUrl(`${countryKey}.${ext}`)
    }
  }
  return null
}
