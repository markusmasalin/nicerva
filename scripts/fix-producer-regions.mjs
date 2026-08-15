// Kertakäyttöinen skripti: kaksi datakorjausta producers-tauluun.
// 1) "Champange" (kirjoitusvirhe) -> "Champagne"
// 2) "Katalonia"/"Catalunya" (kaksi nimeä samalle alueelle) -> "Catalonia"
// Näyttää rivit ennen ja jälkeen kunkin päivityksen.
// Aja: node scripts/fix-producer-regions.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function selectByRegion(regions) {
  const { data, error } = await supabase.from('producers').select('id, name, region').in('region', regions)
  if (error) throw error
  return data ?? []
}

async function updateRegion(fromRegions, toRegion) {
  const { data, error } = await supabase.from('producers').update({ region: toRegion }).in('region', fromRegions).select('id, name, region')
  if (error) throw error
  return data ?? []
}

console.log('--- 1) Ennen: region = "Champange" ---')
console.log(await selectByRegion(['Champange']))

console.log('\n--- Päivitetään "Champange" -> "Champagne" ---')
const champagneUpdated = await updateRegion(['Champange'], 'Champagne')
console.log(`Päivitetty ${champagneUpdated.length} riviä:`)
console.log(champagneUpdated)

console.log('\n--- 2) Ennen: region IN ("Katalonia", "Catalunya") ---')
console.log(await selectByRegion(['Katalonia', 'Catalunya']))

console.log('\n--- Päivitetään "Katalonia"/"Catalunya" -> "Catalonia" ---')
const catalanUpdated = await updateRegion(['Katalonia', 'Catalunya'], 'Catalonia')
console.log(`Päivitetty ${catalanUpdated.length} riviä:`)
console.log(catalanUpdated)
