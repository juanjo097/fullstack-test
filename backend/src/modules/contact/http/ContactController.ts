import type { Response } from 'express'
import type { AuthenticatedRequest } from '@shared/http'
import { created, noContent, ok, paginated } from '@shared/http'
import { forbidden, notFound } from '@shared/errors'
import { parseListQuery } from '@shared/listing'
import type { ContactUseCases } from '../application'

export class ContactController {
  constructor(private readonly contactUseCases: ContactUseCases) {}

  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user
    const listQuery = parseListQuery(req.query)
    const contacts = await this.contactUseCases.getAllByOrganization(
      organizationId,
      listQuery
    )
    paginated(res, contacts.data, contacts.meta)
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const contact = await this.contactUseCases.getContactById(id)
    if (!contact) throw notFound("Contact not found")    
    // Ensure contact belongs to user's organization
    if (contact.organizationId !== req.user.organizationId) throw forbidden("Access denied")
    ok(res, contact)
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user
    const { name, email, phone } = req.body
    
    const contact = await this.contactUseCases.createContact({
      organizationId,
      name,
      email,
      phone,
    })
    created(res, contact)
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const { name, email, phone } = req.body

    const existing = await this.contactUseCases.getContactById(id)
    if (!existing) throw notFound('Contact not found')
    if (existing.organizationId !== req.user.organizationId) throw forbidden('Access denied')
    const contact = await this.contactUseCases.updateContact(id, {
      name,
      email,
      phone,
    })
    ok(res, contact)
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params
    const existing = await this.contactUseCases.getContactById(id)
    if (!existing) throw notFound('Contact not found')
    if (existing.organizationId !== req.user.organizationId) throw forbidden('Access denied')
    await this.contactUseCases.deleteContact(id)
    noContent(res)
  }
}
