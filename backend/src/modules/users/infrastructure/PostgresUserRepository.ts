import type { Repository } from 'typeorm'
import type { User, CreateUserDTO, UserRepository } from '../domain'
import { applyTypeOrmListQuery, type ListQuery, type PaginatedResult } from '@shared/listing'
import { UserEntity } from './UserEntity'

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly repository: Repository<UserEntity>) {}

  async findAll(query: ListQuery): Promise<PaginatedResult<User>> {
    const qb = this.repository.createQueryBuilder('user')

    const result = await applyTypeOrmListQuery(
      qb,
      query,
      ['id', 'name', 'email', 'createdAt'],
      'user'
    )

    return {
      data: result.data.map((entity) => (entity as UserEntity).toDomain()),
      meta: result.meta,
    }
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } })
    return entity?.toDomain() ?? null
  }

  async create(data: CreateUserDTO): Promise<User> {
    const entity = this.repository.create({
      name: data.name,
      email: data.email,
    })
    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id)
    return (result.affected ?? 0) > 0
  }
}
