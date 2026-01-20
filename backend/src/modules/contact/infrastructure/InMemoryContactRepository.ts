import type {
  Contact,
  CreateContactDTO,
  UpdateContactDTO,
  ContactRepository,
} from '../domain'
import { applyListQuery, type ListQuery, type PaginatedResult } from '@shared/listing'

export class InMemoryContactRepository implements ContactRepository {
  private contacts: Map<string, Contact> = new Map()

  async findAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Contact>> {
    const contacts = Array.from(this.contacts.values()).filter(
      (c) => c.organizationId === organizationId
    )
    return applyListQuery(contacts, query, [
      'id',
      'organizationId',
      'name',
      'email',
      'phone',
      'createdAt',
    ])
  }

  async findById(id: string): Promise<Contact | null> {
    return this.contacts.get(id) ?? null
  }

  async create(data: CreateContactDTO): Promise<Contact> {
    const contact: Contact = {
      id: crypto.randomUUID(),
      organizationId: data.organizationId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      createdAt: new Date(),
    }
    this.contacts.set(contact.id, contact)
    return contact
  }

  async update(id: string, data: UpdateContactDTO): Promise<Contact | null> {
    const contact = this.contacts.get(id)
    if (!contact) return null

    const updated: Contact = {
      ...contact,
      name: data.name ?? contact.name,
      email: data.email !== undefined ? data.email ?? null : contact.email,
      phone: data.phone !== undefined ? data.phone ?? null : contact.phone,
    }
    this.contacts.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    return this.contacts.delete(id)
  }

  clear(): void {
    this.contacts.clear()
  }
}
