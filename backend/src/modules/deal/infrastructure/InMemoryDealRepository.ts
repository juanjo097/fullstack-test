import type { Deal, CreateDealDTO, UpdateDealDTO, DealRepository } from '../domain'
import { applyListQuery, type ListQuery, type PaginatedResult } from '@shared/listing'

export class InMemoryDealRepository implements DealRepository {
  private deals: Map<string, Deal> = new Map()

  async findAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Deal>> {
    const deals = Array.from(this.deals.values()).filter(
      (d) => d.organizationId === organizationId
    )
    return applyListQuery(deals, query, [
      'id',
      'organizationId',
      'contactId',
      'stageId',
      'title',
      'value',
      'status',
      'createdAt',
    ])
  }

  async findById(id: string): Promise<Deal | null> {
    return this.deals.get(id) ?? null
  }

  async create(data: CreateDealDTO): Promise<Deal> {
    const deal: Deal = {
      id: crypto.randomUUID(),
      organizationId: data.organizationId,
      contactId: data.contactId ?? null,
      stageId: data.stageId ?? null,
      title: data.title,
      value: data.value,
      status: 'open',
      createdAt: new Date(),
    }
    this.deals.set(deal.id, deal)
    return deal
  }

  async update(id: string, data: UpdateDealDTO): Promise<Deal | null> {
    const deal = this.deals.get(id)
    if (!deal) return null

    const updated: Deal = {
      ...deal,
      contactId: data.contactId !== undefined ? data.contactId : deal.contactId,
      stageId: data.stageId !== undefined ? data.stageId : deal.stageId,
      title: data.title ?? deal.title,
      value: data.value ?? deal.value,
      status: data.status ?? deal.status,
    }
    this.deals.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.deals.delete(id)
  }

  clear(): void {
    this.deals.clear()
  }
}
