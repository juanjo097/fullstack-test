import "dotenv/config";
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { UserEntity } from '@modules/users/infrastructure'
import { OrganizationEntity } from '@modules/organization/infrastructure'
import { ContactEntity } from '@modules/contact/infrastructure'
import { WorkflowEntity, StageEntity } from '@modules/workflow/infrastructure'
import { DealEntity } from '@modules/deal/infrastructure'
import { SessionEntity } from '@modules/auth/infrastructure'
import { RoleEntity } from '@modules/roles/infrastructure'
import { AuditLogEntity } from '@modules/audit/infrastructure'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'fullstack_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [
    OrganizationEntity,
    UserEntity,
    ContactEntity,
    WorkflowEntity,
    StageEntity,
    DealEntity,
    SessionEntity,
    RoleEntity,
    AuditLogEntity,
  ],
  migrations: ['src/shared/infrastructure/database/migrations/*.ts'],
  subscribers: [],
})
