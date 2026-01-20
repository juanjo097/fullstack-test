import type { Repository } from 'typeorm'
import type { AuditLog, AuditLogRepository, CreateAuditLogDTO } from '../domain'
import { AuditLogEntity } from './AuditLogEntity'

export class PostgresAuditLogRepository implements AuditLogRepository {
  constructor(private readonly repository: Repository<AuditLogEntity>) {}

  async create(data: CreateAuditLogDTO): Promise<AuditLog> {
    const entity = this.repository.create({
      organizationId: data.organizationId,
      actorUserId: data.actorUserId,
      action: data.action,
      targetType: data.targetType ?? null,
      targetId: data.targetId ?? null,
      details: data.details ?? null,
    })
    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async findAllByOrganizationId(organizationId: string): Promise<AuditLog[]> {
    const entities = await this.repository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    })
    return entities.map((entity) => entity.toDomain())
  }
}
