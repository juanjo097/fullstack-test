import type { Repository } from 'typeorm'
import type { Deal, CreateDealDTO, UpdateDealDTO, DealRepository } from '../domain'
import { applyTypeOrmListQuery, type ListQuery, type PaginatedResult } from '@shared/listing'
import { DealEntity } from './DealEntity'

export class PostgresDealRepository implements DealRepository {
  constructor(private readonly repository: Repository<DealEntity>) {}

  async findAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Deal>> {
    const qb = this.repository
      .createQueryBuilder('deal')
      .where('deal.organizationId = :organizationId', { organizationId })

    const result = await applyTypeOrmListQuery(
      qb,
      query,
      [
        'id',
        'organizationId',
        'contactId',
        'stageId',
        'title',
        'value',
        'status',
        'createdAt',
      ],
      'deal'
    )

    return {
      data: result.data.map((entity) => (entity as DealEntity).toDomain()),
      meta: result.meta,
    }
  }

  async findById(id: string): Promise<Deal | null> {
    const entity = await this.repository.findOne({ where: { id } })
    return entity?.toDomain() ?? null
  }

  async create(data: CreateDealDTO): Promise<Deal> {
    const entity = this.repository.create({
      organizationId: data.organizationId,
      contactId: data.contactId ?? null,
      stageId: data.stageId ?? null,
      title: data.title,
      value: data.value,
      status: 'open',
    })
    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async update(id: string, data: UpdateDealDTO): Promise<Deal | null> {
    const entity = await this.repository.findOne({ where: { id } })
    if (!entity) return null

    if (data.contactId !== undefined) entity.contactId = data.contactId
    if (data.stageId !== undefined) entity.stageId = data.stageId
    if (data.title !== undefined) entity.title = data.title
    if (data.value !== undefined) entity.value = data.value
    if (data.status !== undefined) entity.status = data.status

    const saved = await this.repository.save(entity)
    return saved.toDomain()
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id)
    return (result.affected ?? 0) > 0
  }
}
