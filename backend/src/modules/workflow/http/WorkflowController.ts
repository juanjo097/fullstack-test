import type { Response } from 'express'
import type { AuthenticatedRequest } from '@shared/http'
import { created, noContent, ok, paginated } from '@shared/http'
import { forbidden, notFound } from '@shared/errors'
import { parseListQuery } from '@shared/listing'
import type { WorkflowUseCases } from '../application'

export class WorkflowController {
  constructor(private readonly workflowUseCases: WorkflowUseCases) {}

  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user
    const listQuery = parseListQuery(req.query)
    const workflows = await this.workflowUseCases.getAllByOrganization(
      organizationId,
      listQuery
    )
    paginated(res, workflows.data, workflows.meta)
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const workflow = await this.workflowUseCases.getWorkflowById(id)
    if (!workflow) throw notFound('Workflow not found')
    if (workflow.organizationId !== req.user.organizationId) throw forbidden('Access denied')
    ok(res, workflow)
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user
    const { name, stages } = req.body

    const workflow = await this.workflowUseCases.createWorkflow({
      organizationId,
      name,
      stages,
    })
    created(res, workflow)
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { name } = req.body
    
    const existing = await this.workflowUseCases.getWorkflowById(id)
    if (!existing) throw notFound('Workflow not found')
    if (existing.organizationId !== req.user.organizationId) throw forbidden('Access denied')
    
    const workflow = await this.workflowUseCases.updateWorkflow(id, { name })
    ok(res, workflow)
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params

    const existing = await this.workflowUseCases.getWorkflowById(id)
    if (!existing) throw notFound("Workflow not found")
    if (existing.organizationId !== req.user.organizationId) throw forbidden('Access denied')

    await this.workflowUseCases.deleteWorkflow(id)
    created(res, existing)
  }

  async addStage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { name, order, color } = req.body

    const workflow = await this.workflowUseCases.getWorkflowById(id)
    if (!workflow) throw notFound("Workflow not found")
    if (workflow.organizationId !== req.user.organizationId) throw forbidden('Access denied')

    const stage = await this.workflowUseCases.addStage({
      workflowId: id,
      name,
      order,
      color,
    })
    created(res, stage)
  }

  async updateStage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id, stageId } = req.params
    const { name, order, color } = req.body

    const workflow = await this.workflowUseCases.getWorkflowById(id)
    if (!workflow) throw notFound('Workflow not found')

    if (workflow.organizationId !== req.user.organizationId) throw forbidden('Access denied')

    const stage = await this.workflowUseCases.updateStage(stageId, {
      name,
      order,
      color,
    })

    if (!stage) throw notFound("Stage not found")
    ok(res, stage)
  }

  async deleteStage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id, stageId } = req.params

    const workflow = await this.workflowUseCases.getWorkflowById(id)
    if (!workflow) throw notFound("Workflow not found")
    if (workflow.organizationId !== req.user.organizationId) throw forbidden('Access denied')

    const deleted = await this.workflowUseCases.deleteStage(stageId)
    if (!deleted) throw notFound("Stage not found")

    noContent(res)
  }
}
