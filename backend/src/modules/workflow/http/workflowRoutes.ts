import { Router, type RequestHandler } from 'express'
import type { WorkflowController } from './WorkflowController'
import { validateRequest } from '@shared/validation'
import { asyncHandler } from '@shared/http'
import {
  createStageSchema,
  createWorkflowSchema,
  stageIdSchema,
  updateStageSchema,
  updateWorkflowSchema,
  workflowIdSchema,
  workflowListSchema,
} from '@shared/validation/schemas'
import { Permissions, type Permission } from '@modules/roles/domain'

export function createWorkflowRoutes(
  controller: WorkflowController,
  authMiddleware: RequestHandler,
  requirePermission: (permissions: Permission[]) => RequestHandler,
): Router {
  const router = Router()

  router.use(authMiddleware);

  router.get(
    "/",
    requirePermission([Permissions.WorkflowsRead]),
    validateRequest(workflowListSchema),
    asyncHandler((req, res) => controller.getAll(req as any, res)),
  );
  router.get(
    "/:id",
    requirePermission([Permissions.WorkflowsRead]),
    validateRequest(workflowIdSchema),
    asyncHandler((req, res) => controller.getById(req as any, res)),
  );
  router.post(
    "/",
    requirePermission([Permissions.WorkflowsWrite]),
    validateRequest(createWorkflowSchema),
    asyncHandler((req, res) => controller.create(req as any, res)),
  );
  router.put(
    "/:id",
    requirePermission([Permissions.WorkflowsWrite]),
    validateRequest(updateWorkflowSchema),
    asyncHandler((req, res) => controller.update(req as any, res)),
  );
  router.delete(
    "/:id",
    requirePermission([Permissions.WorkflowsWrite]),
    validateRequest(workflowIdSchema),
    asyncHandler((req, res) => controller.delete(req as any, res)),
  );
  
  // Stage routes
  router.post(
    "/:id/stages",
    requirePermission([Permissions.WorkflowsWrite]),
    validateRequest(createStageSchema),
    asyncHandler((req, res) => controller.addStage(req as any, res)),
  );
  router.put(
    "/:id/stages/:stageId",
    requirePermission([Permissions.WorkflowsWrite]),
    validateRequest(updateStageSchema),
    asyncHandler((req, res) => controller.updateStage(req as any, res)),
  );
  router.delete(
    "/:id/stages/:stageId",
    requirePermission([Permissions.WorkflowsWrite]),
    validateRequest(stageIdSchema),
    asyncHandler((req, res) => controller.deleteStage(req as any, res)),
  );

  return router
}
