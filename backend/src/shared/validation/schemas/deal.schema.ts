import z from "zod";
import { listQuerySchema } from "./list.schema";

const dealBody = z.object({
  title: z.string().min(2).max(100),
  value: z.number().min(0),
  contactId: z.string().optional(),
  stageId: z.string().optional(),
});

export const dealIdSchema = z.object({
  body: z.any(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
});

export const dealListSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: listQuerySchema,
});

export const createDealSchema = z.object({
  body: dealBody,
  params: z.any(),
  query: z.any(),
});

export const updateDealSchema = z.object({
  body: dealBody
    .extend({
      status: z.enum(["open", "won", "lost"]).optional(),
      contactId: z.string().nullable().optional(),
      stageId: z.string().nullable().optional(),
    })
    .partial(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
});
