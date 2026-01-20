import type { User, CreateUserDTO, UserRepository } from '../domain'
import { applyListQuery, type ListQuery, type PaginatedResult } from '@shared/listing'

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map()

  async findAll(query: ListQuery): Promise<PaginatedResult<User>> {
    const users = Array.from(this.users.values())
    return applyListQuery(users, query, ['id', 'name', 'email', 'createdAt'])
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      createdAt: new Date(),
    }
    this.users.set(user.id, user)
    return user
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id)
  }
}
