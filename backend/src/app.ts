import express, { type Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import type { DataSource } from 'typeorm'
import { createAuthMiddleware, createPermissionMiddleware } from '@shared/http'
import { errorHandler } from '@shared/errors'
import {
  UserUseCases,
  UserEntity,
  PostgresUserRepository,
  UserController,
  createUserRoutes,
} from '@modules/users'
import {
  RoleUseCases,
  RoleEntity,
  PostgresRoleRepository,
  RoleController,
  createRoleRoutes,
} from '@modules/roles'
import {
  AuditLogUseCases,
  AuditLogEntity,
  PostgresAuditLogRepository,
  AuditLogController,
  createAuditLogRoutes,
} from '@modules/audit'
import {
  AuthUseCases,
  PostgresAuthRepository,
  PostgresSessionRepository,
  BcryptPasswordHasher,
  JwtTokenGenerator,
  AuthController,
  createAuthRoutes,
  SessionEntity,
  RefreshTokenService,
} from '@modules/auth'
import {
  OrganizationUseCases,
  OrganizationEntity,
  PostgresOrganizationRepository,
  OrganizationController,
  createOrganizationRoutes,
} from '@modules/organization'
import {
  ContactUseCases,
  ContactEntity,
  PostgresContactRepository,
  ContactController,
  createContactRoutes,
} from '@modules/contact'
import {
  WorkflowUseCases,
  WorkflowEntity,
  StageEntity,
  PostgresWorkflowRepository,
  WorkflowController,
  createWorkflowRoutes,
} from '@modules/workflow'
import {
  DealUseCases,
  DealEntity,
  PostgresDealRepository,
  DealController,
  createDealRoutes,
} from '@modules/deal'

const JWT_SECRET = process.env.JWT_SECRET ?? 'your-secret-key-change-in-production'

export function createApp(dataSource: DataSource): Express {
  const app = express()

  // Middleware
  app.use(cors())
  app.use(cookieParser())
  app.use(express.json())

  // Token Generator (shared for auth and middleware)
  const tokenGenerator = new JwtTokenGenerator(JWT_SECRET)

  // Auth Middleware
  const authMiddleware = createAuthMiddleware(tokenGenerator)

  // Organization Module - Dependency Injection
  const organizationRepository = new PostgresOrganizationRepository(
    dataSource.getRepository(OrganizationEntity)
  )
  const organizationUseCases = new OrganizationUseCases(organizationRepository)
  const organizationController = new OrganizationController(organizationUseCases)

  // Roles Module - Dependency Injection
  const roleRepository = new PostgresRoleRepository(
    dataSource.getRepository(RoleEntity)
  )
  const roleUseCases = new RoleUseCases(roleRepository)

  // Audit Module - Dependency Injection
  const auditLogRepository = new PostgresAuditLogRepository(
    dataSource.getRepository(AuditLogEntity)
  )
  const auditLogUseCases = new AuditLogUseCases(auditLogRepository)
  const auditLogController = new AuditLogController(auditLogUseCases)

  // Users Module - Dependency Injection
  const userRepository = new PostgresUserRepository(
    dataSource.getRepository(UserEntity)
  )
  const userUseCases = new UserUseCases(userRepository)
  const userController = new UserController(userUseCases, auditLogUseCases, roleUseCases)

  const roleController = new RoleController(roleUseCases, auditLogUseCases)

  // Workflow Module - Dependency Injection
  const workflowRepository = new PostgresWorkflowRepository(
    dataSource.getRepository(WorkflowEntity),
    dataSource.getRepository(StageEntity)
  )
  const workflowUseCases = new WorkflowUseCases(workflowRepository)
  const workflowController = new WorkflowController(workflowUseCases)

  // Auth Module - Dependency Injection
  const authRepository = new PostgresAuthRepository(
    dataSource.getRepository(UserEntity)
  )
  const passwordHasher = new BcryptPasswordHasher()

  // Refresh Token Service
  const refreshTokenService = new RefreshTokenService()
  const sessionRepository = new PostgresSessionRepository(
    dataSource.getRepository(SessionEntity)
  )
  const authUseCases = new AuthUseCases(
    authRepository,
    passwordHasher,
    tokenGenerator,
    organizationRepository,
    workflowRepository,
    sessionRepository,
    refreshTokenService,
    roleUseCases
  )
  const authController = new AuthController(authUseCases)


  // Contact Module - Dependency Injection
  const contactRepository = new PostgresContactRepository(
    dataSource.getRepository(ContactEntity)
  )
  const contactUseCases = new ContactUseCases(contactRepository)
  const contactController = new ContactController(contactUseCases)

  // Deal Module - Dependency Injection
  const dealRepository = new PostgresDealRepository(
    dataSource.getRepository(DealEntity)
  )
  const dealUseCases = new DealUseCases(dealRepository)
  const dealController = new DealController(dealUseCases)

  // Permission Middleware
  const requirePermission = createPermissionMiddleware(
    userRepository,
    roleUseCases,
    auditLogRepository
  )

  // Routes (public)
  app.use('/api/auth', createAuthRoutes(authController))
  app.use('/api/users', createUserRoutes(userController, authMiddleware, requirePermission))

  // Routes (protected - require auth)
  app.use('/api/organizations', createOrganizationRoutes(organizationController, authMiddleware, requirePermission))
  app.use('/api/contacts', createContactRoutes(contactController, authMiddleware, requirePermission))
  app.use('/api/workflows', createWorkflowRoutes(workflowController, authMiddleware, requirePermission))
  app.use('/api/deals', createDealRoutes(dealController, authMiddleware, requirePermission))
  app.use('/api/roles', createRoleRoutes(roleController, authMiddleware, requirePermission))
  app.use('/api/audit-logs', createAuditLogRoutes(auditLogController, authMiddleware, requirePermission))

  app.use(errorHandler)

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  return app
}
