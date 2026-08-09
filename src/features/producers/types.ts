import { z } from 'zod'

export const producerSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  country: z.string().nullable(),
  region: z.string().nullable(),
})
export type Producer = z.infer<typeof producerSchema>
