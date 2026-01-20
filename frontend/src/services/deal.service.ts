import { api, normalizeApiResponse, ApiResponse, type PaginatedResponse } from './api'
import { buildListQueryString, type ListQueryParams } from '../utils'

export type DealStatus = 'open' | 'won' | 'lost'

export interface Deal {
  id: string
  organizationId: string
  contactId: string | null
  stageId: string | null
  title: string
  value: number
  status: DealStatus
  createdAt: string
}

export interface CreateDealDTO {
  contactId?: string
  stageId?: string
  title: string
  value: number
}

export interface UpdateDealDTO {
  contactId?: string | null
  stageId?: string | null
  title?: string
  value?: number
  status?: DealStatus
}

export const dealService = {
  getAll: async (params?: ListQueryParams) =>
    api.get<PaginatedResponse<Deal[]>>(
      `/deals${buildListQueryString(params)}`
    ),

  getById: async (id: string) =>
    normalizeApiResponse(await api.get<ApiResponse<Deal>>(`/deals/${id}`)),

  create: async (data: CreateDealDTO) =>
    normalizeApiResponse(await api.post<ApiResponse<Deal>>("/deals", data)),

  update: async (id: string, data: UpdateDealDTO) =>
    normalizeApiResponse(
      await api.put<ApiResponse<Deal>>(`/deals/${id}`, data),
    ),

  delete: (id: string) => api.delete(`/deals/${id}`),
};
