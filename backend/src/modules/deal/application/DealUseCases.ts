import type { Deal, CreateDealDTO, UpdateDealDTO, DealRepository } from '../domain'
import type { ListQuery, PaginatedResult } from '@shared/listing'

export class DealUseCases {
  constructor(private readonly dealRepository: DealRepository) {}

  async getAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Deal>> {
    return this.dealRepository.findAllByOrganization(organizationId, query)
  }

  async getDealById(id: string): Promise<Deal | null> {
    return this.dealRepository.findById(id)
  }

  async createDeal(data: CreateDealDTO): Promise<Deal> {
    return this.dealRepository.create(data)
  }

  async updateDeal(id: string, data: UpdateDealDTO): Promise<Deal | null> {
    return this.dealRepository.update(id, data)
  }

  async deleteDeal(id: string): Promise<boolean> {
    return this.dealRepository.delete(id)
  }
}
