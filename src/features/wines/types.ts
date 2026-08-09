import { z } from 'zod'

export const wineTypeSchema = z.enum(['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'])
export type WineType = z.infer<typeof wineTypeSchema>

export const wineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nimi vaaditaan'),
  producer: z.string().min(1, 'Tuottaja vaaditaan'),
  country: z.string().min(1, 'Maa vaaditaan'),
  region: z.string().min(1, 'Alue vaaditaan'),
  appellation: z.string().nullable(),
  grapes: z.array(z.string()),
  vintage: z.number().int().nullable(),
  type: wineTypeSchema,
  notes: z.string().nullable(),
  labelImageUrl: z.string().nullable(),
  createdAt: z.string(),
})
export type Wine = z.infer<typeof wineSchema>

// Lomakedata ennen tallennusta: ei vielä id:tä eikä createdAt:ia,
// ne generoi tietokanta.
export const newWineSchema = wineSchema.omit({ id: true, createdAt: true })
export type NewWine = z.infer<typeof newWineSchema>

export type WineFilterParams = {
  search?: string
  country?: string
  region?: string
  appellation?: string
  grape?: string
  vintage?: number
}
