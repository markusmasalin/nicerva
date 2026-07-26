import { supabase } from '../../lib/supabase'
import type { Bottle, NewBottle } from './types'

function toBottle(row: Record<string, unknown>): Bottle {
  return {
    id: row.id as string,
    wineId: row.wine_id as string,
    purchasePrice: row.purchase_price as number | null,
    purchaseDate: row.purchase_date as string | null,
    location: row.location as string | null,
    status: row.status as Bottle['status'],
    note: row.note as string | null,
    createdAt: row.created_at as string,
  }
}

function toRow(bottle: NewBottle) {
  return {
    wine_id: bottle.wineId,
    purchase_price: bottle.purchasePrice,
    purchase_date: bottle.purchaseDate,
    location: bottle.location,
    status: bottle.status,
    note: bottle.note,
  }
}

export async function getBottlesForWine(wineId: string): Promise<Bottle[]> {
  const { data, error } = await supabase
    .from('bottles')
    .select('*')
    .eq('wine_id', wineId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toBottle)
}

export async function getBottleCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('bottles').select('wine_id').eq('status', 'cellar')
  if (error) throw error
  return (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.wine_id] = (acc[row.wine_id] ?? 0) + 1
    return acc
  }, {})
}

export async function getAveragePrices(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('bottles')
    .select('wine_id, purchase_price')
    .eq('status', 'cellar')
  if (error) throw error

  const sums: Record<string, { total: number; count: number }> = {}
  for (const row of data ?? []) {
    if (row.purchase_price == null) continue
    const entry = sums[row.wine_id] ?? { total: 0, count: 0 }
    entry.total += row.purchase_price
    entry.count += 1
    sums[row.wine_id] = entry
  }

  return Object.fromEntries(
    Object.entries(sums).map(([wineId, { total, count }]) => [wineId, total / count]),
  )
}

export async function createBottle(bottle: NewBottle): Promise<Bottle> {
  const { data, error } = await supabase.from('bottles').insert(toRow(bottle)).select().single()
  if (error) throw error
  return toBottle(data)
}

export async function updateBottle(id: string, bottle: NewBottle): Promise<Bottle> {
  const { data, error } = await supabase.from('bottles').update(toRow(bottle)).eq('id', id).select().single()
  if (error) throw error
  return toBottle(data)
}

export async function deleteBottle(id: string): Promise<void> {
  const { error } = await supabase.from('bottles').delete().eq('id', id)
  if (error) throw error
}
