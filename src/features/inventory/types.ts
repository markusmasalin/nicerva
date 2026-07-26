import { z } from 'zod'

export const bottleStatusSchema = z.enum(['cellar', 'consumed', 'gifted'])
export type BottleStatus = z.infer<typeof bottleStatusSchema>

export const bottleSchema = z.object({
  id: z.string(),
  wineId: z.string(),
  purchasePrice: z.number().nullable(),
  purchaseDate: z.string().nullable(),
  location: z.string().nullable(),
  status: bottleStatusSchema,
  note: z.string().nullable(),
  createdAt: z.string(),
})
export type Bottle = z.infer<typeof bottleSchema>

export const newBottleSchema = bottleSchema.omit({ id: true, createdAt: true })
export type NewBottle = z.infer<typeof newBottleSchema>
