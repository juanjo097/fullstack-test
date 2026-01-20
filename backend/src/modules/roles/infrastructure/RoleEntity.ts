import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'
import type { Role } from '../domain'
import type { Permission } from '../domain'

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'text', array: true })
  permissions: Permission[]

  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  toDomain(): Role {
    return {
      id: this.id,
      organizationId: this.organizationId,
      name: this.name,
      permissions: this.permissions,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
    }
  }
}
