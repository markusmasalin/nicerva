import { supabase } from '../../lib/supabase'
import { findKnownAppellation } from '../../shared/matchAppellation'
import { findKnownProducer } from './matchProducer'
import { getAllProducers } from '../producers'
import type { Wine, NewWine, WineFilterParams, WineType } from './types'

// Nämä kaksi funktiota ovat AINOA paikka koko sovelluksessa, joka tietää
// miten Supabasen rivimuoto (snake_case) muunnetaan sovelluksen Wine-tyypiksi.
// Jos tietokannan skeema muuttuu, muutos näkyy vain täällä.

function toWine(row: Record<string, unknown>): Wine {
  return {
    id: row.id as string,
    name: row.name as string,
    producer: row.producer as string,
    country: row.country as string,
    region: row.region as string,
    appellation: row.appellation as string | null,
    grapes: (row.grapes as string[]) ?? [],
    vintage: row.vintage as number | null,
    type: row.type as Wine['type'],
    notes: row.notes as string | null,
    labelImageUrl: row.label_image_url as string | null,
    createdAt: row.created_at as string,
  }
}

function toRow(wine: NewWine) {
  return {
    name: wine.name,
    producer: wine.producer,
    country: wine.country,
    region: wine.region,
    appellation: wine.appellation,
    grapes: wine.grapes,
    vintage: wine.vintage,
    type: wine.type,
    notes: wine.notes,
    label_image_url: wine.labelImageUrl,
  }
}

export async function getWines(filters: WineFilterParams = {}): Promise<Wine[]> {
  let query = supabase.from('wines').select('*').order('created_at', { ascending: false })

  if (filters.country) query = query.ilike('country', `%${filters.country}%`)
  if (filters.region) query = query.ilike('region', `%${filters.region}%`)
  if (filters.vintage) query = query.eq('vintage', filters.vintage)
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  const wines = (data ?? []).map(toWine)

  // grapes on array-sarake, eikä contains() tue osittaista tekstihakua
  // array-alkioiden sisällä — suodatetaan siksi client-puolella. Riittävä
  // henkilökohtaisen kokoelman kokoluokassa.
  if (!filters.grape) return wines
  const grapeQuery = filters.grape.toLowerCase()
  return wines.filter((wine) => wine.grapes.some((g) => g.toLowerCase().includes(grapeQuery)))
}

export async function getWine(id: string): Promise<Wine> {
  const { data, error } = await supabase.from('wines').select('*').eq('id', id).single()
  if (error) throw error
  return toWine(data)
}

export async function createWine(wine: NewWine): Promise<Wine> {
  const { data, error } = await supabase.from('wines').insert(toRow(wine)).select().single()
  if (error) throw error
  return toWine(data)
}

export async function updateWine(id: string, wine: NewWine): Promise<Wine> {
  const { data, error } = await supabase.from('wines').update(toRow(wine)).eq('id', id).select().single()
  if (error) throw error
  return toWine(data)
}

export async function deleteWine(id: string): Promise<void> {
  const { error } = await supabase.from('wines').delete().eq('id', id)
  if (error) throw error
}

export async function uploadLabelImage(name: string, producer: string, file: File): Promise<string> {
  const trimmedName = name.trim()
  const trimmedProducer = producer.trim()
  const slug = `${trimmedName}-${trimmedProducer}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const path = `${slug}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('bottle-labels')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('bottle-labels').getPublicUrl(path)
  const publicUrl = data.publicUrl

  const { error: updateError } = await supabase
    .from('wines')
    .update({ label_image_url: publicUrl })
    .ilike('name', trimmedName)
    .ilike('producer', trimmedProducer)
  if (updateError) throw updateError

  return publicUrl
}

export type WineIdentityUpdate = Pick<NewWine, 'name' | 'producer' | 'country' | 'region' | 'appellation' | 'type'>

// Päivittää identiteettikentät KAIKKIIN ryhmän riveihin (name+producer-täsmäys),
// koskematta vintage-, grapes- tai label_image_url-kenttiin.
export async function updateWineIdentity(
  name: string,
  producer: string,
  updates: WineIdentityUpdate,
): Promise<void> {
  const trimmedName = name.trim()
  const trimmedProducer = producer.trim()

  const { error } = await supabase
    .from('wines')
    .update({
      name: updates.name,
      producer: updates.producer,
      country: updates.country,
      region: updates.region,
      appellation: updates.appellation,
      type: updates.type,
    })
    .ilike('name', trimmedName)
    .ilike('producer', trimmedProducer)
  if (error) throw error
}

export type IdentifiedWine = {
  name: string | null
  producer: string | null
  vintage: number | null
  country: string | null
  region: string | null
  appellation: string | null
  grapes: string[] | null
  type: WineType | null
  confidence: 'high' | 'medium' | 'low'
}

export type IdentifyWineResult = {
  wine: IdentifiedWine
  detectedText: string[]
}

// Lukee File-objektin base64-merkkijonoksi ilman "data:image/...;base64,"
// -etuliitettä, jotta sen voi lähettää suoraan identify-wine-funktiolle.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function identifyWine(frontImage: File, backImage?: File): Promise<IdentifyWineResult> {
  const image = await fileToBase64(frontImage)
  const mediaType = frontImage.type

  const payload: Record<string, string> = { image, mediaType }
  if (backImage) {
    payload.backImage = await fileToBase64(backImage)
    payload.backMediaType = backImage.type
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const response = await fetch(`${supabaseUrl}/functions/v1/identify-wine`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) throw new Error('Viinin tunnistus epäonnistui.')

  const result: IdentifyWineResult = await response.json()
  return applyKnownProducer(applyKnownAppellation(result))
}

// Tunnetun appellaatiolistan osuma on luotettavampi kuin LLM:n oma arvaus
// (oikea kirjoitusasu, ei mahdollisia LLM:n pieniä kirjoitusvirheitä), joten
// se korvaa appellation-kentän aina kun osuma löytyy. country/region
// täytetään osumasta vain jos ne olivat vielä tyhjiä.
function applyKnownAppellation(result: IdentifyWineResult): IdentifyWineResult {
  const match = findKnownAppellation(result.detectedText)
  if (!match) return result

  return {
    ...result,
    wine: {
      ...result.wine,
      appellation: match.name,
      country: result.wine.country ?? match.country,
      region: result.wine.region ?? match.region,
    },
  }
}

// Sama periaate producers-taululle: jos raakatekstistä löytyy tunnettu
// tuottaja (name tai jokin alias), korvataan producer-kenttä kanonisella
// name-arvolla ja täytetään country/region vain jos ne olivat vielä tyhjiä.
async function applyKnownProducer(result: IdentifyWineResult): Promise<IdentifyWineResult> {
  const producers = await getAllProducers()
  const match = findKnownProducer(result.detectedText, producers)
  if (!match) return result

  return {
    ...result,
    wine: {
      ...result.wine,
      producer: match.name,
      country: result.wine.country ?? match.country,
      region: result.wine.region ?? match.region,
    },
  }
}
