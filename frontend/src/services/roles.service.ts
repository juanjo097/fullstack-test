import { api, ApiResponse, normalizeApiResponse } from './api'
import type { Permission } from './permissions'

export interface Role {
  id: string
  organizationId: string
  name: string
  permissions: Permission[]
  isSystem: boolean
  createdAt: string
}

export interface CreateRoleDTO {
  name: string
  permissions: Permission[]
}

export interface UpdateRoleDTO {
  name?: string
  permissions?: Permission[]
}

export const roleService = {
  getAll: async () =>
    normalizeApiResponse(await api.get<ApiResponse<Role[]>>('/roles')),

  create: async (data: CreateRoleDTO) =>
    normalizeApiResponse(await api.post<ApiResponse<Role>>('/roles', data)),

  update: async (id: string, data: UpdateRoleDTO) =>
    normalizeApiResponse(await api.put<ApiResponse<Role>>(`/roles/${id}`, data)),

  delete: async (id: string) => api.delete<void>(`/roles/${id}`),
}
