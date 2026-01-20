import type { User, CreateUserDTO } from './User'

export interface UserRepository {
  findAll(): Promise<User[]>
  findAllByOrganizationId(organizationId: string): Promise<User[]>
  findById(id: string): Promise<User | null>
  create(data: CreateUserDTO): Promise<User>
  updateRole(userId: string, roleId: string): Promise<User | null>
  delete(id: string): Promise<boolean>
}
