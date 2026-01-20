import type { Deal, CreateDealDTO, UpdateDealDTO } from './Deal'
import type { ListQuery, PaginatedResult } from '@shared/listing'

export interface DealRepository {
  findAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Deal>>
  findById(id: string): Promise<Deal | null>
  create(data: CreateDealDTO): Promise<Deal>
  update(id: string, data: UpdateDealDTO): Promise<Deal | null>
  delete(id: string): Promise<boolean>
}
