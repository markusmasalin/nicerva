// Kertakäyttöinen skripti: poimii uniikit region+country-parit Italialle,
// Ranskalle, Espanjalle ja Saksalle kahdesta jo olemassa olevasta
// lähteestä (KNOWN_APPELLATIONS + producers-taulu), ei kysy ChatGPT:ltä
// uudestaan. Tulostaa JSON:in [{ countryCode, regions }] stdoutiin.
// Aja: node scripts/extract-regions.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { KNOWN_APPELLATIONS } from '../src/shared/knownAppellations.ts'
import { normalizeText } from '../src/shared/normalizeText.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const TARGET_COUNTRIES = ['IT', 'FR', 'ES', 'DE']

// .env ei ole dotenv-riippuvuutta projektissa, joten luetaan se käsin —
// sama VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY-pari jota src/lib/supabase.ts
// käyttää selainpuolella (import.meta.env), mutta se ei toimi plain Node-
// skriptissä, joten luetaan .env-tiedosto suoraan tässä.
function loadEnv() {
  const envPath = join(__dirname, '..', '.env')
  const raw = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = loadEnv()
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Puuttuvat VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY .env-tiedostosta.')
}
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// key: "IT|toscana" -> ensimmäisenä nähty alkuperäinen kirjoitusasu.
// KNOWN_APPELLATIONS käydään läpi ennen producers-dataa, joten sen
// käsin kuratoitu kirjoitusasu voittaa mahdolliset producers-taulun
// pienet eroavaisuudet (esim. ylimääräinen välilyönti).
const regionsByKey = new Map()

function addRegion(country, region) {
  if (!TARGET_COUNTRIES.includes(country)) return
  const trimmedRegion = (region ?? '').trim()
  if (!trimmedRegion) return
  const key = `${country}|${normalizeText(trimmedRegion)}`
  if (!regionsByKey.has(key)) {
    regionsByKey.set(key, { country, region: trimmedRegion })
  }
}

for (const appellation of KNOWN_APPELLATIONS) {
  addRegion(appellation.country, appellation.region)
}

const { data: producers, error } = await supabase.from('producers').select('country, region')
if (error) throw error
for (const producer of producers ?? []) {
  addRegion(producer.country, producer.region)
}

const byCountry = new Map(TARGET_COUNTRIES.map((code) => [code, []]))
for (const { country, region } of regionsByKey.values()) {
  byCountry.get(country).push(region)
}

const result = TARGET_COUNTRIES.map((countryCode) => ({
  countryCode,
  regions: byCountry.get(countryCode).sort((a, b) => a.localeCompare(b)),
}))

console.log(JSON.stringify(result, null, 2))
