import type { AuthToken } from './Auth'

export interface TokenPayload {
  userId: string
  organizationId: string
  roleId: string | null
}

export interface TokenGenerator {
  generate(userId: string, organizationId: string, roleId: string | null): AuthToken
  verify(token: string): TokenPayload | null
}
