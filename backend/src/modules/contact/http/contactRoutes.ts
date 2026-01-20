import { Router, type RequestHandler } from 'express'
import type { ContactController } from './ContactController'
import { validateRequest } from '@shared/validation'
import { asyncHandler } from '@shared/http'
import {
  contactIdSchema,
  contactListSchema,
  createContactSchema,
  updateContactSchema,
} from '@shared/validation/schemas'
import { Permissions, type Permission } from '@modules/roles/domain'

export function createContactRoutes(
  controller: ContactController,
  authMiddleware: RequestHandler,
  requirePermission: (permissions: Permission[]) => RequestHandler,
): Router {
  const router = Router()

  router.use(authMiddleware)

  router.get(
    "/",
    requirePermission([Permissions.ContactsRead]),
    validateRequest(contactListSchema),
    asyncHandler((req, res) => controller.getAll(req as any, res)),
  );
  router.get(
    "/:id",
    requirePermission([Permissions.ContactsRead]),
    validateRequest(contactIdSchema),
    asyncHandler((req, res) => controller.getById(req as any, res)),
  );
  router.post(
    "/",
    requirePermission([Permissions.ContactsWrite]),
    validateRequest(createContactSchema),
    asyncHandler((req, res) => controller.create(req as any, res)),
  );
  router.put(
    "/:id",
    requirePermission([Permissions.ContactsWrite]),
    validateRequest(updateContactSchema),
    asyncHandler((req, res) => controller.update(req as any, res)),
  );
  router.delete(
    "/:id",
    requirePermission([Permissions.ContactsWrite]),
    validateRequest(contactIdSchema),
    asyncHandler((req, res) => controller.delete(req as any, res)),
  );

  return router
}
