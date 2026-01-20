import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import type { User } from '../domain'
import { OrganizationEntity } from '@modules/organization/infrastructure'
import { RoleEntity } from '@modules/roles/infrastructure'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null

  @Column({ type: 'uuid', nullable: true, name: 'organization_id' })
  organizationId: string | null

  @ManyToOne(() => OrganizationEntity, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: OrganizationEntity | null

  @Column({ type: 'uuid', nullable: true, name: 'role_id' })
  roleId: string | null

  @ManyToOne(() => RoleEntity, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  toDomain(): User {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      organizationId: this.organizationId,
      roleId: this.roleId,
      role: this.role
        ? {
            id: this.role.id,
            name: this.role.name,
            permissions: this.role.permissions,
          }
        : null,
      createdAt: this.createdAt,
    }
  }

  static fromDomain(user: Partial<User>): UserEntity {
    const entity = new UserEntity()
    if (user.id) entity.id = user.id
    if (user.name) entity.name = user.name
    if (user.email) entity.email = user.email
    if (user.organizationId) entity.organizationId = user.organizationId
    if (user.roleId) entity.roleId = user.roleId
    if (user.createdAt) entity.createdAt = user.createdAt
    return entity
  }
}
