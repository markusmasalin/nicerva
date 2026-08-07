import { z } from 'zod'

export const tastingSchema = z.object({
  id: z.string(),
  wineId: z.string(),
  bottleId: z.string().nullable(),
  rating: z.number().nullable(),
  note: z.string().nullable(),
  tastedAt: z.string(),
})
export type Tasting = z.infer<typeof tastingSchema>

// Lomakedata ennen tallennusta: ei vielä id:tä, sen generoi tietokanta.
export const newTastingSchema = tastingSchema.omit({ id: true })
export type NewTasting = z.infer<typeof newTastingSchema>
