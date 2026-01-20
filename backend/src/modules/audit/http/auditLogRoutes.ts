import { Router, type RequestHandler } from 'express'
import type { AuditLogController } from './AuditLogController'
import { asyncHandler } from '@shared/http'
import { Permissions, type Permission } from '@modules/roles/domain'

type PermissionMiddlewareFactory = (permissions: Permission[]) => RequestHandler

export function createAuditLogRoutes(
  controller: AuditLogController,
  authMiddleware: RequestHandler,
  requirePermission: PermissionMiddlewareFactory,
): Router {
  const router = Router()

  router.use(authMiddleware)
  router.get(
    '/',
    requirePermission([Permissions.AuditRead]),
    asyncHandler((req, res) => controller.getAll(req, res)),
  )

  return router
}
