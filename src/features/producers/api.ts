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

const SEARCH_LIMIT = 8

// Kaksi erillistä hakua: ilike name-kenttään, ja ilike aliases-taulukon
// tekstimuotoon (jotta osuma löytyy vaikka query täsmäisi vain osan
// aliaksesta, ei koko alkiota). Yhdistetään, poistetaan duplikaatit
// id:n perusteella, järjestetään nimen mukaan ja rajataan tulosmäärä.
export async function searchProducers(query: string): Promise<Producer[]> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const [byName, byAlias] = await Promise.all([
    supabase.from('producers').select('*').ilike('name', `%${trimmed}%`).order('name').limit(SEARCH_LIMIT),
    supabase
      .from('producers')
      .select('*')
      .filter('aliases::text', 'ilike', `%${trimmed}%`)
      .order('name')
      .limit(SEARCH_LIMIT),
  ])

  if (byName.error) throw byName.error
  if (byAlias.error) throw byAlias.error

  const merged = new Map<string, Producer>()
  for (const row of [...(byName.data ?? []), ...(byAlias.data ?? [])]) {
    const producer = toProducer(row)
    merged.set(producer.id, producer)
  }

  return Array.from(merged.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, SEARCH_LIMIT)
}
