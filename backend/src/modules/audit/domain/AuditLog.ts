export interface AuditLog {
  id: string
  organizationId: string
  actorUserId: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  details?: Record<string, unknown> | null
  createdAt: Date
}

export interface CreateAuditLogDTO {
  organizationId: string
  actorUserId: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  details?: Record<string, unknown> | null
}
