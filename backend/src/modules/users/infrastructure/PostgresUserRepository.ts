import type { Repository } from 'typeorm'
import type { User, CreateUserDTO, UserRepository } from '../domain'
import { UserEntity } from './UserEntity'

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly repository: Repository<UserEntity>) {}

  async findAll(): Promise<User[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' },
      relations: { role: true },
    })
    return entities.map((entity) => entity.toDomain())
  }

  async findAllByOrganizationId(organizationId: string): Promise<User[]> {
    const entities = await this.repository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      relations: { role: true },
    })
    return entities.map((entity) => entity.toDomain())
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id }, relations: { role: true } })
    return entity?.toDomain() ?? null
  }

  async create(data: CreateUserDTO): Promise<User> {
    const entity = this.repository.create({
      name: data.name,
      email: data.email,
      organizationId: data.organizationId ?? null,
      roleId: data.roleId ?? null,
    })
    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async updateRole(userId: string, roleId: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id: userId }, relations: { role: true } })
    if (!entity) return null
    entity.roleId = roleId
    await this.repository.save(entity)
    const refreshed = await this.repository.findOne({ where: { id: userId }, relations: { role: true } })
    return refreshed?.toDomain() ?? null
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id)
    return (result.affected ?? 0) > 0
  }
}
