import { useQuery } from '@tanstack/react-query'
import * as api from './api'

const TEN_MINUTES = 10 * 60 * 1000

// Manifesti muuttuu vain kun joku lisää uusia alue-/maakuvia koriin —
// pitkä staleTime välttää turhat list()-kutsut normaalikäytössä.
export function useRegionPhotoManifest() {
  return useQuery({
    queryKey: ['region-photos', 'manifest'],
    queryFn: api.getRegionPhotoManifest,
    staleTime: TEN_MINUTES,
  })
}
