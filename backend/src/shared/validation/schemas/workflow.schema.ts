import z from "zod";
import { listQuerySchema } from "./list.schema";

const stageBody = z.object({
  name: z.string().min(2).max(50),
  order: z.number().int().min(0),
  color: z.string().optional(),
});

const workflowBody = z.object({
  name: z.string().min(2).max(50),
  stages: z.array(stageBody).optional(),
});

export const workflowIdSchema = z.object({
  body: z.any(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
});

export const workflowListSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: listQuerySchema,
});

export const stageIdSchema = z.object({
  body: z.any(),
  params: z.object({
    id: z.string().min(1),
    stageId: z.string().min(1),
  }),
  query: z.any(),
});

export const createWorkflowSchema = z.object({
  body: workflowBody,
  params: z.any(),
  query: z.any(),
});

export const updateWorkflowSchema = z.object({
  body: workflowBody.partial(),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
});

export const createStageSchema = z.object({
  body: stageBody,
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.any(),
});

export const updateStageSchema = z.object({
  body: stageBody.partial(),
  params: z.object({
    id: z.string().min(1),
    stageId: z.string().min(1),
  }),
  query: z.any(),
});
