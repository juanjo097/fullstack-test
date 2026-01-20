import z from "zod";
import { listQuerySchema } from "./list.schema";

const contactBody = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const contactIdSchema = z.object({
  body: z.any(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
});

export const contactListSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: listQuerySchema,
});

export const createContactSchema = z.object({
  body: contactBody,
  params: z.any(),
  query: z.any(),
});

export const updateContactSchema = z.object({
  body: contactBody.partial(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
});
