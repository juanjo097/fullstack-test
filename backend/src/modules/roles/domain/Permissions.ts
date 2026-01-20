export const Permissions = {
  OrganizationRead: 'organization:read',
  OrganizationWrite: 'organization:write',
  ContactsRead: 'contacts:read',
  ContactsWrite: 'contacts:write',
  DealsRead: 'deals:read',
  DealsWrite: 'deals:write',
  WorkflowsRead: 'workflows:read',
  WorkflowsWrite: 'workflows:write',
  UsersRead: 'users:read',
  UsersWrite: 'users:write',
  RolesRead: 'roles:read',
  RolesWrite: 'roles:write',
  AuditRead: 'audit:read',
} as const

export type Permission = (typeof Permissions)[keyof typeof Permissions]

export const ALL_PERMISSIONS: Permission[] = Object.values(Permissions)

export const DEFAULT_ROLES = [
  {
    name: 'Admin',
    permissions: ALL_PERMISSIONS,
    isSystem: true,
  },
  {
    name: 'Manager',
    permissions: [
      Permissions.OrganizationRead,
      Permissions.ContactsRead,
      Permissions.ContactsWrite,
      Permissions.DealsRead,
      Permissions.DealsWrite,
      Permissions.WorkflowsRead,
      Permissions.WorkflowsWrite,
      Permissions.UsersRead,
      Permissions.RolesRead,
      Permissions.AuditRead,
    ],
    isSystem: true,
  },
  {
    name: 'Sales Rep',
    permissions: [
      Permissions.ContactsRead,
      Permissions.ContactsWrite,
      Permissions.DealsRead,
      Permissions.DealsWrite,
      Permissions.WorkflowsRead,
      Permissions.OrganizationRead,
    ],
    isSystem: true,
  },
  {
    name: 'Read-only',
    permissions: [
      Permissions.OrganizationRead,
      Permissions.ContactsRead,
      Permissions.DealsRead,
      Permissions.WorkflowsRead,
    ],
    isSystem: true,
  },
] as const
