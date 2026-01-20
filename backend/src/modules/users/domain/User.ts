export interface User {
  id: string
  name: string
  email: string
  organizationId: string | null
  roleId: string | null
  role: {
    id: string
    name: string
    permissions: string[]
  } | null
  createdAt: Date
}

export interface CreateUserDTO {
  name: string
  email: string
  organizationId?: string | null
  roleId?: string | null
}
