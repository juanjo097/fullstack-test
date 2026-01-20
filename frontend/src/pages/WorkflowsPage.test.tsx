import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkflowsPage } from './WorkflowsPage'
import { workflowService, notify } from '../services'

vi.mock('../services', () => ({
  workflowService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    addStage: vi.fn(),
    updateStage: vi.fn(),
    deleteStage: vi.fn(),
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
  name: 'Prospect',
  order: 1,
  color: '#111111',
}

const workflowFixture = {
  id: 'workflow-1',
  organizationId: 'org-1',
  name: 'Sales Pipeline',
  stages: [stageFixture],
  createdAt: '2024-01-01',
}

describe('WorkflowsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(workflowService.getAll).mockResolvedValue({
      data: [workflowFixture],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    vi.mocked(workflowService.getById).mockResolvedValue(workflowFixture)
  })

  it('shows a success toast when adding a stage', async () => {
    const user = userEvent.setup()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Qualified')
    vi.mocked(workflowService.addStage).mockResolvedValue({
      ...stageFixture,
      id: 'stage-2',
      name: 'Qualified',
      order: 2,
    })

    render(<WorkflowsPage />)

    await screen.findByRole('heading', { name: /workflows/i })

    await user.click(screen.getByRole('button', { name: /add stage/i }))

    await waitFor(() => {
      expect(workflowService.addStage).toHaveBeenCalledWith(workflowFixture.id, {
        name: 'Qualified',
        order: 2,
        color: '#6B7280',
      })
      expect(notify.success).toHaveBeenCalledWith(
        'The workflow stage was created successfully',
      )
    })

    promptSpy.mockRestore()
  })

  it('shows a success toast when renaming a stage', async () => {
    const user = userEvent.setup()
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Discovery')
    vi.mocked(workflowService.updateStage).mockResolvedValue({
      ...stageFixture,
      name: 'Discovery',
    })

    render(<WorkflowsPage />)

    await screen.findByText(stageFixture.name)

    await user.click(screen.getByRole('button', { name: /rename/i }))

    await waitFor(() => {
      expect(workflowService.updateStage).toHaveBeenCalledWith(
        workflowFixture.id,
        stageFixture.id,
        { name: 'Discovery' },
      )
      expect(notify.success).toHaveBeenCalledWith(
        'The workflow stage was updated successfully',
      )
    })

    promptSpy.mockRestore()
  })

  it('shows a success toast when deleting a stage', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(workflowService.deleteStage).mockResolvedValue(undefined)

    render(<WorkflowsPage />)

    await screen.findByText(stageFixture.name)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(workflowService.deleteStage).toHaveBeenCalledWith(
        workflowFixture.id,
        stageFixture.id,
      )
      expect(notify.success).toHaveBeenCalledWith(
        'The workflow stage was deleted successfully',
      )
    })

    confirmSpy.mockRestore()
  })
})
