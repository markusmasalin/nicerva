// Tämä on producers-moduulin AINOA julkinen rajapinta. Muut moduulit ja app/
// saavat tuoda vain täältä — eivät suoraan esim. features/producers/api.ts:stä.
export type { Producer } from './types'
export { searchProducers, getAllProducers, createProducer, ensureProducer } from './api'
