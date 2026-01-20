import type { Repository } from 'typeorm'
import type { Contact, CreateContactDTO, UpdateContactDTO, ContactRepository } from '../domain'
import { applyTypeOrmListQuery, type ListQuery, type PaginatedResult } from '@shared/listing'
import { ContactEntity } from './ContactEntity'

export class PostgresContactRepository implements ContactRepository {
  constructor(private readonly repository: Repository<ContactEntity>) {}

  async findAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Contact>> {
    const qb = this.repository
      .createQueryBuilder('contact')
      .where('contact.organizationId = :organizationId', { organizationId })

    const result = await applyTypeOrmListQuery(
      qb,
      query,
      ['id', 'organizationId', 'name', 'email', 'phone', 'createdAt'],
      'contact'
    )

    return {
      data: result.data.map((entity) => (entity as ContactEntity).toDomain()),
      meta: result.meta,
    }
  }

  async findById(id: string): Promise<Contact | null> {
    const entity = await this.repository.findOne({ where: { id } })
    return entity?.toDomain() ?? null
  }

  async create(data: CreateContactDTO): Promise<Contact> {
    const entity = this.repository.create({
      organizationId: data.organizationId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
    })
    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async update(id: string, data: UpdateContactDTO): Promise<Contact | null> {
    const entity = await this.repository.findOne({ where: { id } })
    if (!entity) return null

    if (data.name !== undefined) entity.name = data.name
    if (data.email !== undefined) entity.email = data.email
    if (data.phone !== undefined) entity.phone = data.phone

    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id)
    return (result.affected ?? 0) > 0
  }
}
