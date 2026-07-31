// Tämä on wines-moduulin AINOA julkinen rajapinta. Muut moduulit ja app/
// saavat tuoda vain täältä — eivät suoraan esim. features/wines/api.ts:stä.
export type { Wine, NewWine, WineType, WineFilterParams } from './types'
export { useWines, useWine, useCreateWine, useUpdateWine, useDeleteWine } from './useWines'
export { uploadLabelImage, identifyWine } from './api'
export type { IdentifiedWine, IdentifyWineResult } from './api'
export { WineList } from './components/WineList'
export { WineForm } from './components/WineForm'
export { WineFilters } from './components/WineFilters'
