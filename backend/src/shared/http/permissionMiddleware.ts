import type { RequestHandler } from 'express'
import type { UserRepository } from '@modules/users/domain'
import type { RoleUseCases } from '@modules/roles/application'
import type { Permission } from '@modules/roles/domain'
import type { AuditLogRepository } from '@modules/audit/domain'
import { forbidden, unauthorized } from '@shared/errors'
import type { AuthenticatedRequest } from './AuthenticatedRequest'

export function createPermissionMiddleware(
  userRepository: UserRepository,
  roleUseCases: RoleUseCases,
  auditLogRepository: AuditLogRepository,
): (permissions: Permission[]) => RequestHandler {
  return (permissions: Permission[]) => {
    return (req, _res, next) => {
      void (async () => {
        const userContext = (req as AuthenticatedRequest).user
        if (!userContext) {
          throw unauthorized('Authentication required')
        }

        const user = await userRepository.findById(userContext.userId)
        if (!user || !user.organizationId) {
          throw unauthorized('User not found')
        }

        let role = user.role
        if (!role) {
          const roles = await roleUseCases.ensureDefaultRoles(user.organizationId)
          const adminRole = roles.find((item) => item.name === 'Admin')
          if (adminRole) {
            await userRepository.updateRole(user.id, adminRole.id)
            role = adminRole
          }
        }

        const userPermissions = role?.permissions ?? []
        const hasPermission = permissions.every((permission) =>
          userPermissions.includes(permission),
        )

        if (!hasPermission) {
          try {
            await auditLogRepository.create({
              organizationId: user.organizationId,
              actorUserId: user.id,
              action: 'permission_denied',
              targetType: 'permission',
              targetId: permissions.join(','),
              details: {
                path: req.path,
                method: req.method,
              },
            })
          } catch (error) {
            console.warn('[AUDIT] Failed to log permission denial', error)
          }
          throw forbidden('You do not have permission to perform this action')
        }

        ;(req as AuthenticatedRequest).user = {
          ...userContext,
          roleId: role?.id ?? null,
          roleName: role?.name ?? null,
          permissions: userPermissions,
        }

        next()
      })().catch(next)
    }
  }
}
