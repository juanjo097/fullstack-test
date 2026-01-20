import type { Repository } from 'typeorm'
import type { AuthUser, RegisterDTO, AuthRepository } from '../domain'
import { UserEntity } from '@modules/users/infrastructure'

export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly repository: Repository<UserEntity>) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const entity = await this.repository.findOne({ where: { email }, relations: { role: true } })
    if (!entity || !entity.password) {
      return null
    }
    return this.toAuthUser(entity)
  }

  async findById(id: string): Promise<AuthUser | null> {
    const entity = await this.repository.findOne({ where: { id }, relations: { role: true } })
    if (!entity || !entity.password) {
      return null
    }
    return this.toAuthUser(entity)
  }

  async create(
    data: RegisterDTO & { hashedPassword: string; organizationId: string; roleId?: string | null }
  ): Promise<AuthUser> {
    const entity = this.repository.create({
      name: data.name,
      email: data.email,
      password: data.hashedPassword,
      organizationId: data.organizationId,
      roleId: data.roleId ?? null,
    })
    const saved = await this.repository.save(entity)
    const refreshed = await this.repository.findOne({ where: { id: saved.id }, relations: { role: true } })
    return this.toAuthUser(refreshed ?? saved)
  }

  async updateRole(userId: string, roleId: string): Promise<AuthUser | null> {
    const entity = await this.repository.findOne({ where: { id: userId }, relations: { role: true } })
    if (!entity || !entity.password) {
      return null
    }
    entity.roleId = roleId
    await this.repository.save(entity)
    const refreshed = await this.repository.findOne({ where: { id: userId }, relations: { role: true } })
    if (!refreshed || !refreshed.password) return null
    return this.toAuthUser(refreshed)
  }

  private toAuthUser(entity: UserEntity): AuthUser {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      name: entity.name,
      email: entity.email,
      password: entity.password!,
      createdAt: entity.createdAt,
      roleId: entity.roleId ?? null,
      role: entity.role
        ? {
            id: entity.role.id,
            name: entity.role.name,
            permissions: entity.role.permissions,
          }
        : null,
    }
  }
}
