import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { NewTasting } from './types'

export function useAverageRatingsByWine() {
  return useQuery({ queryKey: ['tastings', 'average-ratings'], queryFn: api.getAverageRatingsByWine })
}

export function useGroupAverageRating(wineIds: string[]) {
  return useQuery({
    queryKey: ['tastings', 'group-average', ...wineIds],
    queryFn: () => api.getGroupAverageRating(wineIds),
    enabled: wineIds.length > 0,
  })
}

export function useCreateTasting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tasting: NewTasting) => api.createTasting(tasting),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tastings'] }),
  })
}

export function useTastingsForWine(wineId: string) {
  return useQuery({
    queryKey: ['tastings', 'wine', wineId],
    queryFn: () => api.getTastingsForWine(wineId),
    enabled: !!wineId,
  })
}

export function useDeleteTasting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteTasting(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tastings'] }),
  })
}
