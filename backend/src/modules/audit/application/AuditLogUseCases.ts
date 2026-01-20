import type { AuditLog, AuditLogRepository, CreateAuditLogDTO } from '../domain'

export class AuditLogUseCases {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async createLog(data: CreateAuditLogDTO): Promise<AuditLog> {
    return this.auditLogRepository.create(data)
  }

  async getLogs(organizationId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.findAllByOrganizationId(organizationId)
  }
}
