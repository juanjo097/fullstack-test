import type { Permission } from './Permissions'

export interface Role {
  id: string
  organizationId: string
  name: string
  permissions: Permission[]
  isSystem: boolean
  createdAt: Date
}

export interface CreateRoleDTO {
  organizationId: string
  name: string
  permissions: Permission[]
  isSystem?: boolean
}

export interface UpdateRoleDTO {
  name?: string
  permissions?: Permission[]
}
