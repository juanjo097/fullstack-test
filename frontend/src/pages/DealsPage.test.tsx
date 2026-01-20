import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DealsPage } from './DealsPage'
import { dealService, workflowService, contactService, notify } from '../services'

vi.mock('../services', () => ({
  dealService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  workflowService: {
    getAll: vi.fn(),
  },
  contactService: {
    getAll: vi.fn(),
  },
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const stageFixture = {
  id: 'stage-1',
  workflowId: 'workflow-1',
  name: 'New',
  order: 1,
  color: '#111111',
}

const secondaryStageFixture = {
  id: 'stage-2',
  workflowId: 'workflow-1',
  name: 'Won',
  order: 2,
  color: '#222222',
}

const workflowFixture = {
  id: 'workflow-1',
  organizationId: 'org-1',
  name: 'Sales Pipeline',
  stages: [stageFixture, secondaryStageFixture],
  createdAt: '2024-01-01',
}

const contactFixture = {
  id: 'contact-1',
  organizationId: 'org-1',
  name: 'Alex Rivera',
  email: null,
  phone: null,
  createdAt: '2024-01-01',
}

const dealFixture = {
  id: 'deal-1',
  organizationId: 'org-1',
  contactId: contactFixture.id,
  stageId: stageFixture.id,
  title: 'Big Contract',
  value: 1200,
  status: 'open',
  createdAt: '2024-01-01',
}

function mockLoadData({
  deals = [],
  workflows = [workflowFixture],
  contacts = [contactFixture],
} = {}) {
  vi.mocked(dealService.getAll).mockResolvedValue({
    data: deals,
    meta: {
      page: 1,
      limit: 10,
      total: deals.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  })
  vi.mocked(workflowService.getAll).mockResolvedValue({
    data: workflows,
    meta: {
      page: 1,
      limit: 10,
      total: workflows.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  })
  vi.mocked(contactService.getAll).mockResolvedValue({
    data: contacts,
    meta: {
      page: 1,
      limit: 10,
      total: contacts.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  })
}

describe('DealsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a success toast when creating a deal', async () => {
    const user = userEvent.setup()
    mockLoadData()
    vi.mocked(dealService.create).mockResolvedValueOnce(dealFixture)

    render(<DealsPage />)

    await screen.findByRole('heading', { name: /deals/i })

    await user.click(screen.getByRole('button', { name: /^add deal$/i }))
    await user.type(screen.getByLabelText(/title/i), 'New Deal')
    await user.type(screen.getByLabelText(/value/i), '500')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(dealService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Deal',
          value: 500,
          stageId: stageFixture.id,
        }),
      )
      expect(notify.success).toHaveBeenCalledWith(
        'The deal was created successfully',
      )
    })
  })

  it('shows a success toast when updating a deal', async () => {
    const user = userEvent.setup()
    mockLoadData({ deals: [dealFixture] })
    vi.mocked(dealService.update).mockResolvedValueOnce(dealFixture)

    render(<DealsPage />)

    await screen.findByText(dealFixture.title)

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const titleInput = screen.getByLabelText(/title/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Deal')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(dealService.update).toHaveBeenCalledWith(
        dealFixture.id,
        expect.objectContaining({
          title: 'Updated Deal',
          value: dealFixture.value,
        }),
      )
      expect(notify.success).toHaveBeenCalledWith(
        'The deal was updated successfully',
      )
    })
  })

  it('shows a success toast when deleting a deal', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockLoadData({ deals: [dealFixture] })
    vi.mocked(dealService.delete).mockResolvedValueOnce(undefined)

    render(<DealsPage />)

    await screen.findByText(dealFixture.title)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(dealService.delete).toHaveBeenCalledWith(dealFixture.id)
      expect(notify.success).toHaveBeenCalledWith(
        'The deal was deleted successfully',
      )
    })

    confirmSpy.mockRestore()
  })

  it('shows a success toast when changing a deal stage', async () => {
    const user = userEvent.setup()
    mockLoadData({ deals: [dealFixture] })
    vi.mocked(dealService.update).mockResolvedValueOnce(dealFixture)

    render(<DealsPage />)

    await screen.findByText(dealFixture.title)

    await user.click(screen.getByRole('button', { name: /table/i }))
    const stageSelect = screen.getByRole('combobox')
    await user.selectOptions(stageSelect, secondaryStageFixture.id)

    await waitFor(() => {
      expect(dealService.update).toHaveBeenCalledWith(dealFixture.id, {
        stageId: secondaryStageFixture.id,
      })
      expect(notify.success).toHaveBeenCalledWith(
        'The deal stage was updated successfully',
      )
    })
  })
})
