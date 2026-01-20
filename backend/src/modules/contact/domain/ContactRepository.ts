import type { Contact, CreateContactDTO, UpdateContactDTO } from './Contact'
import type { ListQuery, PaginatedResult } from '@shared/listing'

export interface ContactRepository {
  findAllByOrganization(
    organizationId: string,
    query: ListQuery
  ): Promise<PaginatedResult<Contact>>
  findById(id: string): Promise<Contact | null>
  create(data: CreateContactDTO): Promise<Contact>
  update(id: string, data: UpdateContactDTO): Promise<Contact | null>
  delete(id: string): Promise<boolean>
}
