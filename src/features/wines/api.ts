import { supabase } from '../../lib/supabase'
import type { Wine, NewWine, WineFilterParams } from './types'

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

  if (filters.country) query = query.eq('country', filters.country)
  if (filters.region) query = query.eq('region', filters.region)
  if (filters.vintage) query = query.eq('vintage', filters.vintage)
  if (filters.grape) query = query.contains('grapes', [filters.grape])
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toWine)
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
