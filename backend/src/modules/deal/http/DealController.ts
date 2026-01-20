import type { Response } from 'express'
import type { AuthenticatedRequest } from '@shared/http'
import { created, noContent, ok, paginated } from '@shared/http'
import { forbidden, notFound } from '@shared/errors'
import { parseListQuery } from '@shared/listing'
import type { DealUseCases } from '../application'

export class DealController {
  constructor(private readonly dealUseCases: DealUseCases) {}

  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user
    const listQuery = parseListQuery(req.query)
    const deals = await this.dealUseCases.getAllByOrganization(
      organizationId,
      listQuery
    )
    paginated(res, deals.data, deals.meta)
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const deal = await this.dealUseCases.getDealById(id)

    if (!deal) throw notFound('Deal not found')
    if (deal.organizationId !== req.user.organizationId) throw forbidden('Access denied')
    ok(res, deal)
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user
    const { contactId, stageId, title, value } = req.body

    const deal = await this.dealUseCases.createDeal({
      organizationId,
      contactId,
      stageId,
      title,
      value,
    })
    created(res, deal)
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { contactId, stageId, title, value, status } = req.body

    const existing = await this.dealUseCases.getDealById(id)
    
    if (!existing) throw notFound("Deal not found")
    if (existing.organizationId !== req.user.organizationId) throw forbidden('Access denied')

    const deal = await this.dealUseCases.updateDeal(id, {
      contactId,
      stageId,
      title,
      value,
      status,
    })
    ok(res, deal)    
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params

    const existing = await this.dealUseCases.getDealById(id)
    if (!existing) throw notFound('Deal not found')
    if (existing.organizationId !== req.user.organizationId) throw forbidden('Access denied') as any

    await this.dealUseCases.deleteDeal(id)
    noContent(res)
  }
}
