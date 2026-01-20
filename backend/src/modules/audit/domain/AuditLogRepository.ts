import type { AuditLog, CreateAuditLogDTO } from './AuditLog'

export interface AuditLogRepository {
  create(data: CreateAuditLogDTO): Promise<AuditLog>
  findAllByOrganizationId(organizationId: string): Promise<AuditLog[]>
}
