import type { User, CreateUserDTO } from './User'
import type { ListQuery, PaginatedResult } from '@shared/listing'

export interface UserRepository {
  findAll(query: ListQuery): Promise<PaginatedResult<User>>
  findById(id: string): Promise<User | null>
  create(data: CreateUserDTO): Promise<User>
  delete(id: string): Promise<boolean>
}
