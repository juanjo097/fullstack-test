import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contactService } from './contact.service'
import { api } from './api'

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('contactService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should call api.get with correct endpoint', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'Contact 1',
          organizationId: 'org-1',
          email: null,
          phone: null,
          createdAt: '2024-01-01',
        },
      ]
      const mockResponse = {
        data: mockContacts,
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const result = await contactService.getAll()

      expect(api.get).toHaveBeenCalledWith('/contacts')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getById', () => {
    it('should call api.get with correct endpoint', async () => {
      const mockContact = { id: '1', name: 'Test', organizationId: 'org-1', email: null, phone: null, createdAt: '2024-01-01' }
      vi.mocked(api.get).mockResolvedValueOnce(mockContact)

      const result = await contactService.getById('1')

      expect(api.get).toHaveBeenCalledWith('/contacts/1')
      expect(result).toEqual(mockContact)
    })
  })

  describe('create', () => {
    it('should call api.post with correct endpoint and data', async () => {
      const createData = { name: 'New Contact', email: 'new@test.com' }
      const mockCreated = { id: '1', ...createData, organizationId: 'org-1', phone: null, createdAt: '2024-01-01' }
      vi.mocked(api.post).mockResolvedValueOnce(mockCreated)

      const result = await contactService.create(createData)

      expect(api.post).toHaveBeenCalledWith('/contacts', createData)
      expect(result).toEqual(mockCreated)
    })
  })

  describe('update', () => {
    it('should call api.put with correct endpoint and data', async () => {
      const updateData = { name: 'Updated Name' }
      const mockUpdated = { id: '1', name: 'Updated Name', organizationId: 'org-1', email: null, phone: null, createdAt: '2024-01-01' }
      vi.mocked(api.put).mockResolvedValueOnce(mockUpdated)

      const result = await contactService.update('1', updateData)

      expect(api.put).toHaveBeenCalledWith('/contacts/1', updateData)
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('delete', () => {
    it('should call api.delete with correct endpoint', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ success: true })

      await contactService.delete('1')

      expect(api.delete).toHaveBeenCalledWith('/contacts/1')
    })
  })
})
