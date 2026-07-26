import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { NewWine, WineFilterParams } from './types'

// Ohuita wrappereita api.ts:n ympärillä. Ei muuta logiikkaa täällä —
// jos jotain business-logiikkaa alkaa kertyä tänne, se on merkki siitä
// että se pitäisi eriyttää omaksi testattavaksi funktiokseen.

export function useWines(filters: WineFilterParams = {}) {
  return useQuery({
    queryKey: ['wines', filters],
    queryFn: () => api.getWines(filters),
  })
}

export function useWine(id: string) {
  return useQuery({
    queryKey: ['wines', 'detail', id],
    queryFn: () => api.getWine(id),
    enabled: !!id,
  })
}

export function useCreateWine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (wine: NewWine) => api.createWine(wine),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wines'] }),
  })
}

export function useUpdateWine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, wine }: { id: string; wine: NewWine }) => api.updateWine(id, wine),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wines'] }),
  })
}

export function useDeleteWine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteWine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wines'] }),
  })
}
