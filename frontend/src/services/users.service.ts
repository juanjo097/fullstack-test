import { api, ApiResponse, normalizeApiResponse } from './api'
import type { User } from './auth.service'

export interface UpdateUserRoleDTO {
  roleId: string
}

export const userService = {
  getAll: async () =>
    normalizeApiResponse(await api.get<ApiResponse<User[]>>('/users')),

  getMe: async () =>
    normalizeApiResponse(await api.get<ApiResponse<User>>('/users/me')),

  updateRole: async (id: string, data: UpdateUserRoleDTO) =>
    normalizeApiResponse(await api.patch<ApiResponse<User>>(`/users/${id}/role`, data)),
}
