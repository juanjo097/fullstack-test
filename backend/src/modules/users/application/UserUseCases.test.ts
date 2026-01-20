import { describe, it, expect, beforeEach } from 'vitest'
import { UserUseCases } from './UserUseCases'
import { InMemoryUserRepository } from '../infrastructure/InMemoryUserRepository'
import { DEFAULT_LIMIT, DEFAULT_PAGE, type ListQuery } from '@shared/listing'

describe('UserUseCases', () => {
  let userUseCases: UserUseCases
  let userRepository: InMemoryUserRepository
  const listQuery: ListQuery = {
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    filters: [],
    sort: [],
    logic: 'and',
  }

  beforeEach(() => {
    userRepository = new InMemoryUserRepository()
    userUseCases = new UserUseCases(userRepository)
  })

  describe('createUser', () => {
    it('should create a new user', async () => {
      const user = await userUseCases.createUser({
        name: 'John Doe',
        email: 'john@example.com',
      })

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.name).toBe('John Doe')
      expect(user.email).toBe('john@example.com')
      expect(user.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('getAllUsers', () => {
    it('should return empty array when no users exist', async () => {
      const users = await userUseCases.getAllUsers(listQuery)
      expect(users.data).toEqual([])
    })

    it('should return all created users', async () => {
      await userUseCases.createUser({ name: 'User 1', email: 'user1@test.com' })
      await userUseCases.createUser({ name: 'User 2', email: 'user2@test.com' })

      const users = await userUseCases.getAllUsers(listQuery)
      expect(users.data).toHaveLength(2)
    })
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const created = await userUseCases.createUser({
        name: 'Test User',
        email: 'test@example.com',
      })

      const found = await userUseCases.getUserById(created.id)
      expect(found).toEqual(created)
    })

    it('should return null when user not found', async () => {
      const found = await userUseCases.getUserById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      const user = await userUseCases.createUser({
        name: 'To Delete',
        email: 'delete@test.com',
      })

      const result = await userUseCases.deleteUser(user.id)
      expect(result).toBe(true)

      const found = await userUseCases.getUserById(user.id)
      expect(found).toBeNull()
    })

    it('should return false when user does not exist', async () => {
      const result = await userUseCases.deleteUser('non-existent-id')
      expect(result).toBe(false)
    })
  })
})
