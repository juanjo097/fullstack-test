import { Router, type RequestHandler } from 'express'
import type { DealController } from './DealController'
import { validateRequest } from '@shared/validation'
import { asyncHandler } from '@shared/http'
import {
  createDealSchema,
  dealIdSchema,
  dealListSchema,
  updateDealSchema,
} from '@shared/validation/schemas'
import { Permissions, type Permission } from '@modules/roles/domain'

export function createDealRoutes(
  controller: DealController,
  authMiddleware: RequestHandler,
  requirePermission: (permissions: Permission[]) => RequestHandler,
): Router {
  const router = Router()

  router.use(authMiddleware)

  router.get(
    "/",
    requirePermission([Permissions.DealsRead]),
    validateRequest(dealListSchema),
    asyncHandler((req, res) => controller.getAll(req as any, res)),
  );
  router.get(
    "/:id",
    requirePermission([Permissions.DealsRead]),
    validateRequest(dealIdSchema),
    asyncHandler((req, res) => controller.getById(req as any, res)),
  );
  router.post(
    "/",
    requirePermission([Permissions.DealsWrite]),
    validateRequest(createDealSchema),
    asyncHandler((req, res) => controller.create(req as any, res)),
  );
  router.put(
    "/:id",
    requirePermission([Permissions.DealsWrite]),
    validateRequest(updateDealSchema),
    asyncHandler((req, res) => controller.update(req as any, res)),
  );
  router.delete(
    "/:id",
    requirePermission([Permissions.DealsWrite]),
    validateRequest(dealIdSchema),
    asyncHandler((req, res) => controller.delete(req as any, res)),
  );

  return router
}
