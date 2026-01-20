import { api, ApiResponse, normalizeApiResponse } from './api'

export interface User {
  id: string
  name: string
  email: string
  organizationId: string | null
  roleId: string | null
  role: {
    id: string
    name: string
    permissions: string[]
  } | null
}

export interface AuthToken {
  accessToken: string
  expiresAt: string
}

export interface AuthResponse {
  user: User
  token: AuthToken
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export const authService = {
  login: async (credentials: LoginCredentials) =>
    normalizeApiResponse(await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)),

  register: async (credentials: RegisterCredentials) =>
    normalizeApiResponse(await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials)),

  getToken: () => localStorage.getItem('token'),

  setToken: (token: string) => localStorage.setItem('token', token),

  removeToken: () => localStorage.removeItem('token'),

  isAuthenticated: () => !!localStorage.getItem('token'),

  logout: () => api.post<void>('/auth/logout'),
}
