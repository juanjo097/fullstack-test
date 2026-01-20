import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactsPage } from './ContactsPage'
import { contactService, notify } from '../services'

vi.mock('../services', () => ({
  contactService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const contactFixture = {
  id: 'contact-1',
  organizationId: 'org-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: null,
  createdAt: '2024-01-01',
}

const buildResponse = (data: Array<typeof contactFixture>) => ({
  data,
  meta: {
    page: 1,
    limit: 10,
    total: data.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
})

describe('ContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a success toast when creating a contact', async () => {
    const user = userEvent.setup()
    vi.mocked(contactService.getAll)
      .mockResolvedValueOnce(buildResponse([]))
      .mockResolvedValueOnce(buildResponse([]))
    vi.mocked(contactService.create).mockResolvedValueOnce(contactFixture)

    render(<ContactsPage />)

    await screen.findByRole('heading', { name: /contacts/i })

    await user.click(screen.getByRole('button', { name: /add contact/i }))
    await user.type(screen.getByLabelText(/name/i), 'Jane Doe')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(contactService.create).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: '',
        phone: '',
      })
      expect(notify.success).toHaveBeenCalledWith(
        'The contact was created successfully',
      )
    })
  })

  it('shows a success toast when updating a contact', async () => {
    const user = userEvent.setup()
    vi.mocked(contactService.getAll)
      .mockResolvedValueOnce(buildResponse([contactFixture]))
      .mockResolvedValueOnce(buildResponse([contactFixture]))
    vi.mocked(contactService.update).mockResolvedValueOnce(contactFixture)

    render(<ContactsPage />)

    await screen.findByText(contactFixture.name)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(contactService.update).toHaveBeenCalledWith(contactFixture.id, {
        name: contactFixture.name,
        email: contactFixture.email,
        phone: '',
      })
      expect(notify.success).toHaveBeenCalledWith(
        'The contact was updated successfully',
      )
    })
  })

  it('shows a success toast when deleting a contact', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(contactService.getAll)
      .mockResolvedValueOnce(buildResponse([contactFixture]))
      .mockResolvedValueOnce(buildResponse([]))
    vi.mocked(contactService.delete).mockResolvedValueOnce(undefined)

    render(<ContactsPage />)

    await screen.findByText(contactFixture.name)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(contactService.delete).toHaveBeenCalledWith(contactFixture.id)
      expect(notify.success).toHaveBeenCalledWith(
        'The contact was deleted successfully',
      )
    })

    confirmSpy.mockRestore()
  })
})
