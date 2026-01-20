import type { Response } from 'express'
import type { AuthenticatedRequest } from '@shared/http'
import { created, noContent, ok } from '@shared/http'
import { forbidden, notFound } from '@shared/errors'
import type { RoleUseCases } from '../application'
import type { AuditLogUseCases } from '@modules/audit/application'

export class RoleController {
  constructor(
    private readonly roleUseCases: RoleUseCases,
    private readonly auditLogUseCases: AuditLogUseCases,
  ) {}

  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const roles = await this.roleUseCases.getRoles(req.user.organizationId)
    ok(res, roles)
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const role = await this.roleUseCases.getRoleById(id)
    if (!role || role.organizationId !== req.user.organizationId) {
      throw notFound('Role not found')
    }
    ok(res, role)
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, permissions } = req.body
    const role = await this.roleUseCases.createRole({
      organizationId: req.user.organizationId,
      name,
      permissions,
    })
    await this.auditLogUseCases.createLog({
      organizationId: req.user.organizationId,
      actorUserId: req.user.userId,
      action: 'role_created',
      targetType: 'role',
      targetId: role.id,
      details: {
        name: role.name,
      },
    })
    created(res, role)
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const role = await this.roleUseCases.getRoleById(id)
    if (!role || role.organizationId !== req.user.organizationId) {
      throw notFound('Role not found')
    }
    if (role.isSystem && req.body.name && req.body.name !== role.name) {
      throw forbidden('System roles cannot be renamed')
    }
    const updated = await this.roleUseCases.updateRole(id, {
      name: req.body.name,
      permissions: req.body.permissions,
    })
    if (!updated) throw notFound('Role not found')
    await this.auditLogUseCases.createLog({
      organizationId: req.user.organizationId,
      actorUserId: req.user.userId,
      action: 'role_updated',
      targetType: 'role',
      targetId: updated.id,
      details: {
        name: updated.name,
      },
    })
    ok(res, updated)
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const role = await this.roleUseCases.getRoleById(id)
    if (!role || role.organizationId !== req.user.organizationId) {
      throw notFound('Role not found')
    }
    if (role.isSystem) {
      throw forbidden('System roles cannot be deleted')
    }
    const deleted = await this.roleUseCases.deleteRole(id)
    if (!deleted) throw notFound('Role not found')
    await this.auditLogUseCases.createLog({
      organizationId: req.user.organizationId,
      actorUserId: req.user.userId,
      action: 'role_deleted',
      targetType: 'role',
      targetId: role.id,
      details: {
        name: role.name,
      },
    })
    noContent(res)
  }
}
