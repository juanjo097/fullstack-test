import type { User, CreateUserDTO, UserRepository } from '../domain'
import type { ListQuery, PaginatedResult } from '@shared/listing'

export class UserUseCases {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers(query: ListQuery): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(query)
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id)
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    return this.userRepository.create(data)
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id)
  }
}
