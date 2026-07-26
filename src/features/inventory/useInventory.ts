import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { NewBottle } from './types'

export function useBottleCounts() {
  return useQuery({ queryKey: ['inventory', 'bottle-counts'], queryFn: api.getBottleCounts })
}

export function useAveragePrices() {
  return useQuery({ queryKey: ['inventory', 'average-prices'], queryFn: api.getAveragePrices })
}

export function useBottlesForWine(wineId: string) {
  return useQuery({
    queryKey: ['inventory', 'bottles', wineId],
    queryFn: () => api.getBottlesForWine(wineId),
    enabled: !!wineId,
  })
}

export function useCreateBottle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bottle: NewBottle) => api.createBottle(bottle),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useUpdateBottle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, bottle }: { id: string; bottle: NewBottle }) => api.updateBottle(id, bottle),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useDeleteBottle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteBottle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
