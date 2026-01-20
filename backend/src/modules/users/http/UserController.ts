import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '@shared/http'
import { created, noContent, ok } from '@shared/http'
import { notFound } from '@shared/errors'
import type { UserUseCases } from '../application'
import type { RoleUseCases } from '@modules/roles/application'
import type { AuditLogUseCases } from '@modules/audit/application'

export class UserController {
  constructor(
    private readonly userUseCases: UserUseCases,
    private readonly auditLogUseCases: AuditLogUseCases,
    private readonly roleUseCases: RoleUseCases,
  ) {}

  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await this.userUseCases.getAllUsers(req.user.organizationId)
    ok(res, users)
  }

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await this.userUseCases.getUserById(req.user.userId)
    if (!user) throw notFound('User not found')
    ok(res, user)
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const user = await this.userUseCases.getUserById(id)
    if (!user) throw notFound('User not found')
    ok(res, user)
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, email } = req.body
    const roles = await this.roleUseCases.ensureDefaultRoles(req.user.organizationId)
    const defaultRole = roles.find((role) => role.name === 'Read-only') ?? roles[0]
    const user = await this.userUseCases.createUser({
      name,
      email,
      organizationId: req.user.organizationId,
      roleId: defaultRole?.id ?? null,
    })
    created(res, user)
  }

  async assignRole(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { roleId } = req.body
    const user = await this.userUseCases.assignRole(id, roleId)
    if (!user) throw notFound('User not found')
    if (user.organizationId) {
      await this.auditLogUseCases.createLog({
        organizationId: user.organizationId,
        actorUserId: (req as AuthenticatedRequest).user?.userId ?? null,
        action: 'user_role_updated',
        targetType: 'user',
        targetId: user.id,
        details: {
          roleId,
        },
      })
    }
    ok(res, user)
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const deleted = await this.userUseCases.deleteUser(id)
    if (!deleted) throw notFound("User not found")
    noContent(res)
  }
}
