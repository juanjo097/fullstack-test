import type { CreateRoleDTO, Role, UpdateRoleDTO } from './Role'

export interface RoleRepository {
  findAllByOrganizationId(organizationId: string): Promise<Role[]>
  findById(id: string): Promise<Role | null>
  findByOrganizationAndName(organizationId: string, name: string): Promise<Role | null>
  create(data: CreateRoleDTO): Promise<Role>
  update(id: string, data: UpdateRoleDTO): Promise<Role | null>
  delete(id: string): Promise<boolean>
}
