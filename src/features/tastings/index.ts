// Tämä on tastings-moduulin AINOA julkinen rajapinta. Muut moduulit ja app/
// saavat tuoda vain täältä — eivät suoraan esim. features/tastings/api.ts:stä.
export type { Tasting, NewTasting } from './types'
export {
  useAverageRatingsByWine,
  useGroupAverageRating,
  useCreateTasting,
  useTastingsForWine,
  useDeleteTasting,
} from './useTastings'
