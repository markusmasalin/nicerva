import { supabase } from '../../lib/supabase'
import { normalizeText } from '../../shared/normalizeText'
import type { Producer } from './types'

function toProducer(row: Record<string, unknown>): Producer {
  return {
    id: row.id as string,
    name: row.name as string,
    aliases: (row.aliases as string[]) ?? [],
    country: row.country as string | null,
    region: row.region as string | null,
  }
}

// Kevyt select * — käytetään identifyWine():n tuottajantunnistuksessa.
export async function getAllProducers(): Promise<Producer[]> {
  const { data, error } = await supabase.from('producers').select('*')
  if (error) throw error
  return (data ?? []).map(toProducer)
}

// Käyttäjän vahvistama uuden tuottajan lisäys jaettuun tauluun
// (esim. WineForm:n hakukentästä kun osumaa ei löydy).
export async function createProducer(input: {
  name: string
  country: string | null
  region: string | null
}): Promise<Producer> {
  const trimmedName = input.name.trim()
  const { data, error } = await supabase
    .from('producers')
    .insert({
      name: trimmedName,
      normalized_name: normalizeText(trimmedName),
      aliases: [],
      country: input.country,
      region: input.region,
    })
    .select()
    .single()
  if (error) throw error
  return toProducer(data)
}

// Varmistaa että tuottaja on olemassa jaetussa taulussa, kutsutaan
// vasta viinilomakkeen lopullisessa lähetyksessä (ei enää heti
// "+ Lisää uutena tuottajana" -linkin klikkauksesta). Yksi atominen
// upsert normalized_name:n perusteella — jos rivi on jo olemassa
// (esim. toinen käyttäjä ehti juuri samaan aikaan), ignoreDuplicates
// jättää sen koskemattomaksi eikä tästä synny virhettä eikä
// kilpa-ajotilannetta erillisen tarkistus+insert-parin sijaan.
export async function ensureProducer(name: string, country: string, region: string): Promise<void> {
  const trimmedName = name.trim()

  const { error } = await supabase.from('producers').upsert(
    {
      name: trimmedName,
      normalized_name: normalizeText(trimmedName),
      aliases: [],
      country,
      region,
    },
    { onConflict: 'normalized_name', ignoreDuplicates: true },
  )
  if (error) throw error
}

const SEARCH_LIMIT = 8

// Hakee kaikki tuottajat ja suodattaa selaimessa nimen/aliasten mukaan.
// Korvaa aiemman aliases::text-ilike-kyselyn, joka nojasi hauraaseen
// PostgREST-cast-syntaksiin. ~430 tuottajan kokoluokassa tämä on
// yksinkertaisempi ja luotettavampi kuin kaksi erillistä DB-kyselyä.
export async function searchProducers(query: string): Promise<Producer[]> {
  const trimmed = query.trim().toLowerCase()
  if (trimmed.length === 0) return []

  const { data, error } = await supabase.from('producers').select('*').order('name')
  if (error) throw error

  const matches = (data ?? [])
    .map(toProducer)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed) ||
        p.aliases.some((alias) => alias.toLowerCase().includes(trimmed)),
    )

  return matches.slice(0, SEARCH_LIMIT)
}
