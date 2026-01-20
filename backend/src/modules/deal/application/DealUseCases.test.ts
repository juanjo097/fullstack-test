import { describe, it, expect, beforeEach } from 'vitest'
import { DealUseCases } from './DealUseCases'
import { InMemoryDealRepository } from '../infrastructure/InMemoryDealRepository'
import { DEFAULT_LIMIT, DEFAULT_PAGE, type ListQuery } from '@shared/listing'

describe('DealUseCases', () => {
  let dealUseCases: DealUseCases
  let dealRepository: InMemoryDealRepository
  const orgId = 'org-123'
  const listQuery: ListQuery = {
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    filters: [],
    sort: [],
    logic: 'and',
  }

  beforeEach(() => {
    dealRepository = new InMemoryDealRepository()
    dealUseCases = new DealUseCases(dealRepository)
  })

  describe('createDeal', () => {
    it('should create a new deal with required fields', async () => {
      const deal = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'Enterprise Contract',
        value: 50000,
      })

      expect(deal).toBeDefined()
      expect(deal.id).toBeDefined()
      expect(deal.organizationId).toBe(orgId)
      expect(deal.title).toBe('Enterprise Contract')
      expect(deal.value).toBe(50000)
      expect(deal.status).toBe('open')
      expect(deal.contactId).toBeNull()
      expect(deal.stageId).toBeNull()
    })

    it('should create deal with optional fields', async () => {
      const deal = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'Small Deal',
        value: 5000,
        contactId: 'contact-123',
        stageId: 'stage-456',
      })

      expect(deal.contactId).toBe('contact-123')
      expect(deal.stageId).toBe('stage-456')
    })
  })

  describe('getAllByOrganization', () => {
    it('should return empty array when no deals exist', async () => {
      const deals = await dealUseCases.getAllByOrganization(orgId, listQuery)
      expect(deals.data).toEqual([])
    })

    it('should return only deals for the specified organization', async () => {
      await dealUseCases.createDeal({ organizationId: orgId, title: 'Deal 1', value: 1000 })
      await dealUseCases.createDeal({ organizationId: orgId, title: 'Deal 2', value: 2000 })
      await dealUseCases.createDeal({ organizationId: 'other-org', title: 'Other Deal', value: 3000 })

      const deals = await dealUseCases.getAllByOrganization(orgId, listQuery)
      expect(deals.data).toHaveLength(2)
      expect(deals.data.every((d) => d.organizationId === orgId)).toBe(true)
    })
  })

  describe('getDealById', () => {
    it('should return deal when found', async () => {
      const created = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'Test Deal',
        value: 10000,
      })

      const found = await dealUseCases.getDealById(created.id)
      expect(found).toEqual(created)
    })

    it('should return null when deal not found', async () => {
      const found = await dealUseCases.getDealById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('updateDeal', () => {
    it('should update deal fields', async () => {
      const deal = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'Original Title',
        value: 1000,
      })

      const updated = await dealUseCases.updateDeal(deal.id, {
        title: 'Updated Title',
        value: 2000,
        status: 'won',
      })

      expect(updated).toBeDefined()
      expect(updated?.title).toBe('Updated Title')
      expect(updated?.value).toBe(2000)
      expect(updated?.status).toBe('won')
    })

    it('should update deal stage', async () => {
      const deal = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'Pipeline Deal',
        value: 5000,
        stageId: 'stage-1',
      })

      const updated = await dealUseCases.updateDeal(deal.id, {
        stageId: 'stage-2',
      })

      expect(updated?.stageId).toBe('stage-2')
      expect(updated?.title).toBe('Pipeline Deal')
    })

    it('should allow setting contactId to null', async () => {
      const deal = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'Deal with Contact',
        value: 1000,
        contactId: 'contact-123',
      })

      const updated = await dealUseCases.updateDeal(deal.id, {
        contactId: null,
      })

      expect(updated?.contactId).toBeNull()
    })

    it('should return null when deal not found', async () => {
      const updated = await dealUseCases.updateDeal('non-existent-id', {
        title: 'New Title',
      })
      expect(updated).toBeNull()
    })
  })

  describe('deleteDeal', () => {
    it('should delete existing deal', async () => {
      const deal = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'To Delete',
        value: 1000,
      })

      const result = await dealUseCases.deleteDeal(deal.id)
      expect(result).toBe(true)

      const found = await dealUseCases.getDealById(deal.id)
      expect(found).toBeNull()
    })

    it('should return false when deal does not exist', async () => {
      const result = await dealUseCases.deleteDeal('non-existent-id')
      expect(result).toBe(false)
    })
  })

  describe('deal status transitions', () => {
    it('should be able to mark deal as won', async () => {
      const deal = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'Winning Deal',
        value: 10000,
      })

      const updated = await dealUseCases.updateDeal(deal.id, { status: 'won' })
      expect(updated?.status).toBe('won')
    })

    it('should be able to mark deal as lost', async () => {
      const deal = await dealUseCases.createDeal({
        organizationId: orgId,
        title: 'Losing Deal',
        value: 10000,
      })

      const updated = await dealUseCases.updateDeal(deal.id, { status: 'lost' })
      expect(updated?.status).toBe('lost')
    })
  })
})
