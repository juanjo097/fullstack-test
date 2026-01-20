import type {
  Workflow,
  Stage,
  CreateWorkflowDTO,
  UpdateWorkflowDTO,
  CreateStageDTO,
  UpdateStageDTO,
} from './Workflow'
import type { ListQuery, PaginatedResult } from '@shared/listing'

export interface WorkflowRepository {
  findAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Workflow>>
  findById(id: string): Promise<Workflow | null>
  create(data: CreateWorkflowDTO): Promise<Workflow>
  update(id: string, data: UpdateWorkflowDTO): Promise<Workflow | null>
  delete(id: string): Promise<boolean>
  addStage(data: CreateStageDTO): Promise<Stage>
  updateStage(id: string, data: UpdateStageDTO): Promise<Stage | null>
  deleteStage(id: string): Promise<boolean>
}
