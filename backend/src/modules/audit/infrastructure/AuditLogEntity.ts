import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'
import type { AuditLog } from '../domain'

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string

  @Column({ type: 'uuid', name: 'actor_user_id', nullable: true })
  actorUserId: string | null

  @Column({ type: 'varchar', length: 100 })
  action: string

  @Column({ type: 'varchar', length: 100, name: 'target_type', nullable: true })
  targetType: string | null

  @Column({ type: 'uuid', name: 'target_id', nullable: true })
  targetId: string | null

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  toDomain(): AuditLog {
    return {
      id: this.id,
      organizationId: this.organizationId,
      actorUserId: this.actorUserId,
      action: this.action,
      targetType: this.targetType,
      targetId: this.targetId,
      details: this.details,
      createdAt: this.createdAt,
    }
  }
}
