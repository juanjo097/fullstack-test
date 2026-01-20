import z from "zod";
import { listQuerySchema } from "./list.schema";

const userBody = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
});

export const userIdSchema = z.object({
  body: z.any(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
});

export const userSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: listQuerySchema,
});

export const createUserSchema = z.object({
  body: userBody,
  params: z.any(),
  query: z.any(),
});
