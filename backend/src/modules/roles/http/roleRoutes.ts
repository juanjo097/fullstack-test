import { Router, type RequestHandler } from 'express'
import type { RoleController } from './RoleController'
import { validateRequest } from '@shared/validation'
import { asyncHandler } from '@shared/http'
import {
  createRoleSchema,
  roleIdSchema,
  roleSchema,
  updateRoleSchema,
} from '@shared/validation/schemas'
import { Permissions, type Permission } from '../domain'

type PermissionMiddlewareFactory = (permissions: Permission[]) => RequestHandler

export function createRoleRoutes(
  controller: RoleController,
  authMiddleware: RequestHandler,
  requirePermission: PermissionMiddlewareFactory,
): Router {
  const router = Router()

  router.use(authMiddleware)

  router.get(
    '/',
    requirePermission([Permissions.RolesRead]),
    validateRequest(roleSchema),
    asyncHandler((req, res) => controller.getAll(req, res)),
  )
  router.get(
    '/:id',
    requirePermission([Permissions.RolesRead]),
    validateRequest(roleIdSchema),
    asyncHandler((req, res) => controller.getById(req, res)),
  )
  router.post(
    '/',
    requirePermission([Permissions.RolesWrite]),
    validateRequest(createRoleSchema),
    asyncHandler((req, res) => controller.create(req, res)),
  )
  router.put(
    '/:id',
    requirePermission([Permissions.RolesWrite]),
    validateRequest(updateRoleSchema),
    asyncHandler((req, res) => controller.update(req, res)),
  )
  router.delete(
    '/:id',
    requirePermission([Permissions.RolesWrite]),
    validateRequest(roleIdSchema),
    asyncHandler((req, res) => controller.delete(req, res)),
  )

  return router
}
