import type { Repository } from 'typeorm'
import type {
  Workflow,
  Stage,
  CreateWorkflowDTO,
  UpdateWorkflowDTO,
  CreateStageDTO,
  UpdateStageDTO,
  WorkflowRepository,
} from '../domain'
import { applyTypeOrmListQuery, type ListQuery, type PaginatedResult } from '@shared/listing'
import { WorkflowEntity } from './WorkflowEntity'
import { StageEntity } from './StageEntity'

export class PostgresWorkflowRepository implements WorkflowRepository {
  constructor(
    private readonly workflowRepository: Repository<WorkflowEntity>,
    private readonly stageRepository: Repository<StageEntity>
  ) {}

  async findAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Workflow>> {
    const qb = this.workflowRepository
      .createQueryBuilder('workflow')
      .where('workflow.organizationId = :organizationId', { organizationId })

    const result = await applyTypeOrmListQuery(
      qb,
      query,
      ['id', 'organizationId', 'name', 'createdAt'],
      'workflow'
    )

    return {
      data: result.data.map((entity) => (entity as WorkflowEntity).toDomain()),
      meta: result.meta,
    }
  }

  async findById(id: string): Promise<Workflow | null> {
    const entity = await this.workflowRepository.findOne({ where: { id } })
    return entity?.toDomain() ?? null
  }

  async create(data: CreateWorkflowDTO): Promise<Workflow> {
    const workflow = this.workflowRepository.create({
      organizationId: data.organizationId,
      name: data.name,
    })
    const savedWorkflow = await this.workflowRepository.save(workflow)

    if (data.stages && data.stages.length > 0) {
      const stages = data.stages.map((s) =>
        this.stageRepository.create({
          workflowId: savedWorkflow.id,
          name: s.name,
          order: s.order,
          color: s.color ?? null,
        })
      )
      savedWorkflow.stages = await this.stageRepository.save(stages)
    } else {
      savedWorkflow.stages = []
    }

    return savedWorkflow.toDomain()
  }

  async update(id: string, data: UpdateWorkflowDTO): Promise<Workflow | null> {
    const entity = await this.workflowRepository.findOne({ where: { id } })
    if (!entity) return null

    if (data.name !== undefined) entity.name = data.name
    const saved = await this.workflowRepository.save(entity)
    return saved.toDomain()
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.workflowRepository.delete(id)
    return (result.affected ?? 0) > 0
  }

  async addStage(data: CreateStageDTO): Promise<Stage> {
    const stage = this.stageRepository.create({
      workflowId: data.workflowId,
      name: data.name,
      order: data.order,
      color: data.color ?? null,
    })
    const saved = await this.stageRepository.save(stage)
    return saved.toDomain()
  }

  async updateStage(id: string, data: UpdateStageDTO): Promise<Stage | null> {
    const entity = await this.stageRepository.findOne({ where: { id } })
    if (!entity) return null

    if (data.name !== undefined) entity.name = data.name
    if (data.order !== undefined) entity.order = data.order
    if (data.color !== undefined) entity.color = data.color

    const saved = await this.stageRepository.save(entity)
    return saved.toDomain()
  }

  async deleteStage(id: string): Promise<boolean> {
    const result = await this.stageRepository.delete(id)
    return (result.affected ?? 0) > 0
  }
}
