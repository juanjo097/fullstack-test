import z from 'zod'

const roleBody = z.object({
  name: z.string().min(2).max(50),
  permissions: z.array(z.string().min(1)).min(1),
})

export const roleIdSchema = z.object({
  body: z.any(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
})

export const roleSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.any(),
})

export const createRoleSchema = z.object({
  body: roleBody,
  params: z.any(),
  query: z.any(),
})

export const updateRoleSchema = z.object({
  body: roleBody.partial(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
})
