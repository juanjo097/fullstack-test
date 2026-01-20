import { describe, it, expect, beforeEach } from 'vitest'
import { ContactUseCases } from './ContactUseCases'
import { InMemoryContactRepository } from '../infrastructure/InMemoryContactRepository'
import { DEFAULT_LIMIT, DEFAULT_PAGE, type ListQuery } from '@shared/listing'

describe('ContactUseCases', () => {
  let contactUseCases: ContactUseCases
  let contactRepository: InMemoryContactRepository
  const orgId = 'org-123'
  const listQuery: ListQuery = {
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    filters: [],
    sort: [],
    logic: 'and',
  }

  beforeEach(() => {
    contactRepository = new InMemoryContactRepository()
    contactUseCases = new ContactUseCases(contactRepository)
  })

  describe('createContact', () => {
    it('should create a new contact with all fields', async () => {
      const contact = await contactUseCases.createContact({
        organizationId: orgId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1234567890',
      })

      expect(contact).toBeDefined()
      expect(contact.id).toBeDefined()
      expect(contact.organizationId).toBe(orgId)
      expect(contact.name).toBe('Jane Doe')
      expect(contact.email).toBe('jane@example.com')
      expect(contact.phone).toBe('+1234567890')
    })

    it('should create contact with optional fields as null', async () => {
      const contact = await contactUseCases.createContact({
        organizationId: orgId,
        name: 'John Doe',
      })

      expect(contact.name).toBe('John Doe')
      expect(contact.email).toBeNull()
      expect(contact.phone).toBeNull()
    })
  })

  describe('getAllByOrganization', () => {
    it('should return empty array when no contacts exist', async () => {
      const contacts = await contactUseCases.getAllByOrganization(orgId, listQuery)
      expect(contacts.data).toEqual([])
    })

    it('should return only contacts for the specified organization', async () => {
      await contactUseCases.createContact({ organizationId: orgId, name: 'Contact 1' })
      await contactUseCases.createContact({ organizationId: orgId, name: 'Contact 2' })
      await contactUseCases.createContact({ organizationId: 'other-org', name: 'Other Contact' })

      const contacts = await contactUseCases.getAllByOrganization(orgId, listQuery)
      expect(contacts.data).toHaveLength(2)
      expect(contacts.data.every((c) => c.organizationId === orgId)).toBe(true)
    })
  })

  describe('getContactById', () => {
    it('should return contact when found', async () => {
      const created = await contactUseCases.createContact({
        organizationId: orgId,
        name: 'Test Contact',
      })

      const found = await contactUseCases.getContactById(created.id)
      expect(found).toEqual(created)
    })

    it('should return null when contact not found', async () => {
      const found = await contactUseCases.getContactById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('updateContact', () => {
    it('should update contact fields', async () => {
      const contact = await contactUseCases.createContact({
        organizationId: orgId,
        name: 'Original Name',
        email: 'original@test.com',
      })

      const updated = await contactUseCases.updateContact(contact.id, {
        name: 'Updated Name',
        email: 'updated@test.com',
        phone: '+9876543210',
      })

      expect(updated).toBeDefined()
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.email).toBe('updated@test.com')
      expect(updated?.phone).toBe('+9876543210')
    })

    it('should partially update contact', async () => {
      const contact = await contactUseCases.createContact({
        organizationId: orgId,
        name: 'Original',
        email: 'original@test.com',
      })

      const updated = await contactUseCases.updateContact(contact.id, {
        name: 'New Name',
      })

      expect(updated?.name).toBe('New Name')
      expect(updated?.email).toBe('original@test.com')
    })

    it('should return null when contact not found', async () => {
      const updated = await contactUseCases.updateContact('non-existent-id', {
        name: 'New Name',
      })
      expect(updated).toBeNull()
    })
  })

  describe('deleteContact', () => {
    it('should delete existing contact', async () => {
      const contact = await contactUseCases.createContact({
        organizationId: orgId,
        name: 'To Delete',
      })

      const result = await contactUseCases.deleteContact(contact.id)
      expect(result).toBe(true)

      const found = await contactUseCases.getContactById(contact.id)
      expect(found).toBeNull()
    })

    it('should return false when contact does not exist', async () => {
      const result = await contactUseCases.deleteContact('non-existent-id')
      expect(result).toBe(false)
    })
  })
})
