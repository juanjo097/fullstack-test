import type { Response } from 'express'
import type { AuthenticatedRequest } from '@shared/http'
import { ok } from '@shared/http'
import type { AuditLogUseCases } from '../application'

export class AuditLogController {
  constructor(private readonly auditLogUseCases: AuditLogUseCases) {}

  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const logs = await this.auditLogUseCases.getLogs(req.user.organizationId)
    ok(res, logs)
  }
}
