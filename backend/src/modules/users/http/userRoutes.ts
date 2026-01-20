import { Router, type RequestHandler } from 'express'
import type { UserController } from './UserController'
import { validateRequest } from '@shared/validation'
import { asyncHandler } from '@shared/http'
import {
  createUserSchema,
  updateUserRoleSchema,
  userIdSchema,
  userSchema,
} from '@shared/validation/schemas'
import { Permissions, type Permission } from '@modules/roles/domain'

type PermissionMiddlewareFactory = (permissions: Permission[]) => RequestHandler

export function createUserRoutes(
  controller: UserController,
  authMiddleware: RequestHandler,
  requirePermission: PermissionMiddlewareFactory,
): Router {
  const router = Router()

  router.use(authMiddleware)

  router.get(
    "/",
    requirePermission([Permissions.UsersRead]),
    validateRequest(userSchema),
    asyncHandler((req, res) => controller.getAll(req, res)),
  );
  router.get(
    "/me",
    validateRequest(userSchema),
    asyncHandler((req, res) => controller.getMe(req, res)),
  );
  router.get(
    "/:id",
    requirePermission([Permissions.UsersRead]),
    validateRequest(userIdSchema),
    asyncHandler((req, res) => controller.getById(req, res)),
  );
  router.post(
    "/",
    requirePermission([Permissions.UsersWrite]),
    validateRequest(createUserSchema),
    asyncHandler((req, res) => controller.create(req, res)),
  );
  router.patch(
    "/:id/role",
    requirePermission([Permissions.UsersWrite]),
    validateRequest(updateUserRoleSchema),
    asyncHandler((req, res) => controller.assignRole(req, res)),
  );
  router.delete(
    "/:id",
    requirePermission([Permissions.UsersWrite]),
    validateRequest(userIdSchema),
    asyncHandler((req, res) => controller.delete(req, res)),
  );

  return router
}
