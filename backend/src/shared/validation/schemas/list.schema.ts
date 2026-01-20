import z from 'zod'

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  filters: z.string().optional(),
  logic: z.enum(['and', 'or']).optional(),
})
