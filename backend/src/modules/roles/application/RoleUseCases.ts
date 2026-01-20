import type { CreateRoleDTO, Role, RoleRepository, UpdateRoleDTO } from '../domain'
import { DEFAULT_ROLES } from '../domain'

export class RoleUseCases {
  constructor(private readonly roleRepository: RoleRepository) {}

  async getRoles(organizationId: string): Promise<Role[]> {
    return this.roleRepository.findAllByOrganizationId(organizationId)
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.roleRepository.findById(id)
  }

  async createRole(data: CreateRoleDTO): Promise<Role> {
    return this.roleRepository.create(data)
  }

  async updateRole(id: string, data: UpdateRoleDTO): Promise<Role | null> {
    return this.roleRepository.update(id, data)
  }

  async deleteRole(id: string): Promise<boolean> {
    return this.roleRepository.delete(id)
  }

  async ensureDefaultRoles(organizationId: string): Promise<Role[]> {
    const existing = await this.roleRepository.findAllByOrganizationId(organizationId)
    const existingNames = new Set(existing.map((role) => role.name))

    for (const role of DEFAULT_ROLES) {
      if (!existingNames.has(role.name)) {
        await this.roleRepository.create({
          organizationId,
          name: role.name,
          permissions: role.permissions,
          isSystem: true,
        })
      }
    }

    return this.roleRepository.findAllByOrganizationId(organizationId)
  }
}
