import type {
  Workflow,
  Stage,
  CreateWorkflowDTO,
  UpdateWorkflowDTO,
  CreateStageDTO,
  UpdateStageDTO,
  WorkflowRepository,
} from '../domain'
import type { ListQuery, PaginatedResult } from '@shared/listing'

export class WorkflowUseCases {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  async getAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Workflow>> {
    return this.workflowRepository.findAllByOrganization(organizationId, query)
  }

  async getWorkflowById(id: string): Promise<Workflow | null> {
    return this.workflowRepository.findById(id)
  }

  async createWorkflow(data: CreateWorkflowDTO): Promise<Workflow> {
    return this.workflowRepository.create(data)
  }

  async createDefaultWorkflow(organizationId: string): Promise<Workflow> {
    return this.workflowRepository.create({
      organizationId,
      name: 'Sales Pipeline',
      stages: [
        { name: 'Lead', order: 1, color: '#6B7280' },
        { name: 'Qualified', order: 2, color: '#3B82F6' },
        { name: 'Proposal', order: 3, color: '#8B5CF6' },
        { name: 'Negotiation', order: 4, color: '#F59E0B' },
        { name: 'Won', order: 5, color: '#10B981' },
        { name: 'Lost', order: 6, color: '#EF4444' },
      ],
    })
  }

  async updateWorkflow(id: string, data: UpdateWorkflowDTO): Promise<Workflow | null> {
    return this.workflowRepository.update(id, data)
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflowRepository.delete(id)
  }

  async addStage(data: CreateStageDTO): Promise<Stage> {
    return this.workflowRepository.addStage(data)
  }

  async updateStage(id: string, data: UpdateStageDTO): Promise<Stage | null> {
    return this.workflowRepository.updateStage(id, data)
  }

  async deleteStage(id: string): Promise<boolean> {
    return this.workflowRepository.deleteStage(id)
  }
}
