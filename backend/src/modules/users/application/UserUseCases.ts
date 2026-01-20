import type { User, CreateUserDTO, UserRepository } from '../domain'

export class UserUseCases {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers(organizationId: string): Promise<User[]> {
    return this.userRepository.findAllByOrganizationId(organizationId)
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id)
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    return this.userRepository.create(data)
  }

  async assignRole(userId: string, roleId: string): Promise<User | null> {
    return this.userRepository.updateRole(userId, roleId)
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id)
  }
}
