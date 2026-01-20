import { api, ApiResponse, normalizeApiResponse, type PaginatedResponse } from './api'
import { buildListQueryString, type ListQueryParams } from '../utils'

export interface Stage {
  id: string
  workflowId: string
  name: string
  order: number
  color: string | null
}

export interface Workflow {
  id: string
  organizationId: string
  name: string
  stages: Stage[]
  createdAt: string
}

export interface CreateWorkflowDTO {
  name: string
  stages?: { name: string; order: number; color?: string }[]
}

export interface CreateStageDTO {
  name: string
  order: number
  color?: string
}

export const workflowService = {
  getAll: async (params?: ListQueryParams) =>
    api.get<PaginatedResponse<Workflow[]>>(
      `/workflows${buildListQueryString(params)}`
    ),

  getById: async (id: string) =>
    normalizeApiResponse(
      await api.get<ApiResponse<Workflow>>(`/workflows/${id}`),
    ),

  create: async (data: CreateWorkflowDTO) =>
    normalizeApiResponse(
      await api.post<ApiResponse<Workflow>>("/workflows", data),
    ),

  update: async (id: string, data: { name?: string }) =>
    normalizeApiResponse(
      await api.put<ApiResponse<Workflow>>(`/workflows/${id}`, data),
    ),

  delete: (id: string) => api.delete(`/workflows/${id}`),

  addStage: async (workflowId: string, data: CreateStageDTO) =>
    normalizeApiResponse(
      await api.post<ApiResponse<Stage>>(
        `/workflows/${workflowId}/stages`,
        data,
      ),
    ),
  updateStage: async (
    workflowId: string,
    stageId: string,
    data: Partial<CreateStageDTO>,
  ) =>
    normalizeApiResponse(
      await api.put<ApiResponse<Stage>>(
        `/workflows/${workflowId}/stages/${stageId}`,
        data,
      ),
    ),
  deleteStage: (workflowId: string, stageId: string) =>
    api.delete(`/workflows/${workflowId}/stages/${stageId}`),
};
