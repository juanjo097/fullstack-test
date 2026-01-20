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

export const permissionLabels: Record<Permission, string> = {
  [Permissions.OrganizationRead]: 'View organization',
  [Permissions.OrganizationWrite]: 'Manage organization',
  [Permissions.ContactsRead]: 'View contacts',
  [Permissions.ContactsWrite]: 'Manage contacts',
  [Permissions.DealsRead]: 'View deals',
  [Permissions.DealsWrite]: 'Manage deals',
  [Permissions.WorkflowsRead]: 'View workflows',
  [Permissions.WorkflowsWrite]: 'Manage workflows',
  [Permissions.UsersRead]: 'View users',
  [Permissions.UsersWrite]: 'Manage users',
  [Permissions.RolesRead]: 'View roles',
  [Permissions.RolesWrite]: 'Manage roles',
  [Permissions.AuditRead]: 'View audit logs',
}
