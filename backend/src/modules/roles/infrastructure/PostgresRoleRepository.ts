import type { Repository } from 'typeorm'
import type { CreateRoleDTO, Role, RoleRepository, UpdateRoleDTO } from '../domain'
import { RoleEntity } from './RoleEntity'

export class PostgresRoleRepository implements RoleRepository {
  constructor(private readonly repository: Repository<RoleEntity>) {}

  async findAllByOrganizationId(organizationId: string): Promise<Role[]> {
    const entities = await this.repository.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    })
    return entities.map((entity) => entity.toDomain())
  }

  async findById(id: string): Promise<Role | null> {
    const entity = await this.repository.findOne({ where: { id } })
    return entity?.toDomain() ?? null
  }

  async findByOrganizationAndName(
    organizationId: string,
    name: string,
  ): Promise<Role | null> {
    const entity = await this.repository.findOne({
      where: { organizationId, name },
    })
    return entity?.toDomain() ?? null
  }

  async create(data: CreateRoleDTO): Promise<Role> {
    const entity = this.repository.create({
      organizationId: data.organizationId,
      name: data.name,
      permissions: data.permissions,
      isSystem: data.isSystem ?? false,
    })
    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async update(id: string, data: UpdateRoleDTO): Promise<Role | null> {
    const entity = await this.repository.findOne({ where: { id } })
    if (!entity) return null
    if (data.name !== undefined) entity.name = data.name
    if (data.permissions !== undefined) entity.permissions = data.permissions
    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id)
    return (result.affected ?? 0) > 0
  }
}
