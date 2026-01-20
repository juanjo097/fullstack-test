import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { AuthProvider } from '../context/AuthContext'
import { authService, ApiError } from '../services'

vi.mock('../services', () => ({
  authService: {
    login: vi.fn(),
    getToken: vi.fn(() => null),
    setToken: vi.fn(),
    removeToken: vi.fn(),
  },
  userService: {
    getMe: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderLoginPage() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render login form', () => {
    renderLoginPage()

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should have link to register page', () => {
    renderLoginPage()

    const registerLink = screen.getByRole('link', { name: /sign up/i })
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('should update input values on change', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('should call authService.login on form submit', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.login).mockResolvedValueOnce({
      token: { accessToken: 'test-token', expiresAt: '2025-01-01' },
      user: {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        organizationId: 'org-1',
        roleId: 'role-1',
        role: { id: 'role-1', name: 'Admin', permissions: [] },
      },
    })

    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should navigate to dashboard on successful login', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.login).mockResolvedValueOnce({
      token: { accessToken: 'test-token', expiresAt: '2025-01-01' },
      user: {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        organizationId: 'org-1',
        roleId: 'role-1',
        role: { id: 'role-1', name: 'Admin', permissions: [] },
      },
    })

    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should show loading state while submitting', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        token: { accessToken: 'test-token', expiresAt: '2025-01-01' },
        user: {
          id: '1',
          name: 'Test',
          email: 'test@example.com',
          organizationId: 'org-1',
          roleId: 'role-1',
          role: { id: 'role-1', name: 'Admin', permissions: [] },
        },
      }), 100))
    )

    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should display error message on login failure', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.login).mockRejectedValueOnce(
      new ApiError(401, 'Invalid credentials')
    )

    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})
