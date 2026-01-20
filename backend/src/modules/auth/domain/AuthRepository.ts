import type { AuthUser, RegisterDTO } from './Auth'

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>
  findById(id: string): Promise<AuthUser | null>
  create(
    data: RegisterDTO & { hashedPassword: string; organizationId: string; roleId?: string | null }
  ): Promise<AuthUser>
  updateRole(userId: string, roleId: string): Promise<AuthUser | null>
}
