import { Router, type RequestHandler } from 'express'
import type { OrganizationController } from './OrganizationController'
import { validateRequest } from '@shared/validation'
import { asyncHandler } from '@shared/http'
import { organizationSchema, updateOrganizationSchema } from '@shared/validation/schemas'
import { Permissions, type Permission } from '@modules/roles/domain'

export function createOrganizationRoutes(
  controller: OrganizationController,
  authMiddleware: RequestHandler,
  requirePermission: (permissions: Permission[]) => RequestHandler,
): Router {
  const router = Router()

  router.use(authMiddleware)

  router.get(
    "/",
    requirePermission([Permissions.OrganizationRead]),
    validateRequest(organizationSchema),
    asyncHandler((req, res) => controller.getById(req as any, res)),
  );
  router.put(
    "/",
    requirePermission([Permissions.OrganizationWrite]),
    validateRequest(updateOrganizationSchema),
    asyncHandler((req, res) => controller.update(req as any, res)),
  );

  return router
}
