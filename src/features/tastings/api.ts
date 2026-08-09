import { supabase } from '../../lib/supabase'
import type { Tasting, NewTasting } from './types'

function toTasting(row: Record<string, unknown>): Tasting {
  return {
    id: row.id as string,
    wineId: row.wine_id as string,
    bottleId: row.bottle_id as string | null,
    rating: row.rating as number | null,
    score100: row.score_100 as number | null,
    tags: (row.tags as string[]) ?? [],
    foodPairing: row.food_pairing as string | null,
    note: row.note as string | null,
    tastedAt: row.tasted_at as string,
  }
}

function toRow(tasting: NewTasting) {
  return {
    wine_id: tasting.wineId,
    bottle_id: tasting.bottleId,
    rating: tasting.rating,
    score_100: tasting.score100,
    tags: tasting.tags,
    food_pairing: tasting.foodPairing,
    note: tasting.note,
    tasted_at: tasting.tastedAt,
  }
}

export async function createTasting(tasting: NewTasting): Promise<Tasting> {
  const { data, error } = await supabase.from('tastings').insert(toRow(tasting)).select().single()
  if (error) throw error
  return toTasting(data)
}

// Kaikki maistelut yhdelle wine-riville (yksi vuosikerta), uusin ensin.
export async function getTastingsForWine(wineId: string): Promise<Tasting[]> {
  const { data, error } = await supabase
    .from('tastings')
    .select('*')
    .eq('wine_id', wineId)
    .order('tasted_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toTasting)
}

export async function deleteTasting(id: string): Promise<void> {
  const { error } = await supabase.from('tastings').delete().eq('id', id)
  if (error) throw error
}

// Yksittäisen wine_id:n (yhden vuosikerran) keskiarvo — sama malli kuin
// inventory-moduulin getAveragePrices.
export async function getAverageRatingsByWine(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('tastings').select('wine_id, rating')
  if (error) throw error

  const sums: Record<string, { total: number; count: number }> = {}
  for (const row of data ?? []) {
    if (row.rating == null) continue
    const entry = sums[row.wine_id] ?? { total: 0, count: 0 }
    entry.total += row.rating
    entry.count += 1
    sums[row.wine_id] = entry
  }

  return Object.fromEntries(Object.entries(sums).map(([wineId, { total, count }]) => [wineId, total / count]))
}

// Koko name+producer-ryhmän keskiarvo annetuille wine_id:ille yhdessä
// kutsussa — ryhmän kaikkien vuosikertojen maistelut yhdistettynä.
export async function getGroupAverageRating(wineIds: string[]): Promise<number | null> {
  if (wineIds.length === 0) return null

  const { data, error } = await supabase.from('tastings').select('rating').in('wine_id', wineIds)
  if (error) throw error

  const ratings = (data ?? [])
    .map((row) => row.rating as number | null)
    .filter((rating): rating is number => rating != null)
  if (ratings.length === 0) return null

  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
}
