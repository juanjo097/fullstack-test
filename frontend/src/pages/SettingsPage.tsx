import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  organizationService,
  roleService,
  userService,
  type Organization,
  type Permission,
  type Role,
  type User,
  Permissions,
  permissionLabels,
} from '../services'

export function SettingsPage() {
  const { user, hasPermission, refreshUser } = useAuth()
  const canReadUsers = hasPermission(Permissions.UsersRead)
  const canWriteUsers = hasPermission(Permissions.UsersWrite)
  const canReadRoles = hasPermission(Permissions.RolesRead)
  const canWriteRoles = hasPermission(Permissions.RolesWrite)
  const canWriteOrganization = hasPermission(Permissions.OrganizationWrite)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingAccess, setLoadingAccess] = useState(true)
  const [roleForm, setRoleForm] = useState<{ name: string; permissions: Permission[] }>({
    name: '',
    permissions: [],
  })
  const [roleSaving, setRoleSaving] = useState(false)
  const [assigningRoleId, setAssigningRoleId] = useState<string | null>(null)

  useEffect(() => {
    loadOrganization()
  }, [])

  useEffect(() => {
    if (!canReadUsers && !canReadRoles) {
      setLoadingAccess(false)
      return
    }
    loadAccessControl()
  }, [canReadUsers, canReadRoles])

  async function loadOrganization() {
    try {
      const data = await organizationService.get()
      setOrganization(data)
      setName(data.name)
    } catch (error) {
      console.error('Failed to load organization:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadAccessControl() {
    setLoadingAccess(true)
    try {
      const [rolesData, usersData] = await Promise.all([
        canReadRoles ? roleService.getAll() : Promise.resolve([]),
        canReadUsers ? userService.getAll() : Promise.resolve([]),
      ])
      setRoles(rolesData)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to load access control data:', error)
    } finally {
      setLoadingAccess(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await organizationService.update({ name })
      setOrganization(updated)
      setEditing(false)
    } catch (error) {
      console.error('Failed to update organization:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateRole() {
    if (!canWriteRoles) return
    setRoleSaving(true)
    try {
      const newRole = await roleService.create({
        name: roleForm.name,
        permissions: roleForm.permissions,
      })
      setRoles((prev) => [...prev, newRole])
      setRoleForm({ name: '', permissions: [] })
    } catch (error) {
      console.error('Failed to create role:', error)
    } finally {
      setRoleSaving(false)
    }
  }

  async function handleAssignRole(userId: string, roleId: string) {
    if (!canWriteUsers) return
    setAssigningRoleId(userId)
    try {
      const updated = await userService.updateRole(userId, { roleId })
      setUsers((prev) => prev.map((item) => (item?.id === updated.id ? updated : item)))
      if (updated.id === user?.id) {
        await refreshUser()
      }
    } catch (error) {
      console.error('Failed to update user role:', error)
    } finally {
      setAssigningRoleId(null)
    }
  }

  const permissionsList = useMemo(() => {
    const userPermissions = user?.role?.permissions ?? []
    return userPermissions.map((permission) => ({
      key: permission,
      label: permissionLabels[permission as keyof typeof permissionLabels] ?? permission,
    }))
  }, [user])

  if (loading) {
    return <div className="text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and organization</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500">Name</label>
              <p className="text-slate-900">{user?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">Email</label>
              <p className="text-slate-900">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Organization</h2>
            {!editing && canWriteOrganization && (
              <button
                onClick={() => setEditing(true)}
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setName(organization?.name || '')
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500">Name</label>
                <p className="text-slate-900">{organization?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500">Created</label>
                <p className="text-slate-900">
                  {organization?.createdAt
                    ? new Date(organization.createdAt).toLocaleDateString()
                    : '-'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your permissions</h2>
          {permissionsList.length === 0 ? (
            <p className="text-slate-500">No permissions assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {permissionsList.map((permission) => (
                <span
                  key={permission.key}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
                >
                  {permission.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {(canReadUsers || canReadRoles) && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Access Control</h2>
              <p className="text-slate-500 mt-1">Manage roles and permissions for your team.</p>
            </div>

            {loadingAccess ? (
              <p className="text-slate-500">Loading access control...</p>
            ) : (
              <div className="space-y-6">
                {canReadUsers && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase mb-3">Team Members</h3>
                    <div className="space-y-3">
                      {users.length === 0 ? (
                        <p className="text-slate-500">No users found.</p>
                      ) : (
                        users.map((teamUser) => (
                          <div
                            key={teamUser?.id}
                            className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{teamUser?.name}</p>
                              <p className="text-sm text-slate-500">{teamUser?.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-slate-500">
                                {teamUser?.role?.name ?? 'Unassigned'}
                              </span>
                              {canWriteUsers && (
                                <select
                                  value={teamUser?.role?.id ?? ''}
                                  onChange={(e) => handleAssignRole(teamUser!.id, e.target.value)}
                                  disabled={assigningRoleId === teamUser?.id}
                                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                                >
                                  <option value="" disabled>
                                    Select role
                                  </option>
                                  {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                      {role.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {canReadRoles && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-700 uppercase">Roles</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {roles.map((role) => (
                        <div key={role.id} className="rounded-lg border border-slate-200 p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900">{role.name}</p>
                            {role.isSystem && (
                              <span className="text-xs uppercase text-slate-400">System</span>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {role.permissions.map((permission) => (
                              <span
                                key={permission}
                                className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600"
                              >
                                {permissionLabels[permission] ?? permission}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {canWriteRoles && (
                      <div className="rounded-lg border border-dashed border-slate-300 p-4 space-y-4">
                        <h4 className="text-sm font-semibold text-slate-700">Create Custom Role</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={roleForm.name}
                            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                            placeholder="Role name"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(permissionLabels).map(([permission, label]) => (
                              <label
                                key={permission}
                                className="flex items-center gap-2 text-sm text-slate-600"
                              >
                                <input
                                  type="checkbox"
                                  checked={roleForm.permissions.includes(permission as Permission)}
                                  onChange={(e) => {
                                    setRoleForm((prev) => ({
                                      ...prev,
                                      permissions: e.target.checked
                                        ? [...prev.permissions, permission as Permission]
                                        : prev.permissions.filter((value) => value !== (permission as Permission)),
                                    }))
                                  }}
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                          <button
                            onClick={handleCreateRole}
                            disabled={roleSaving || roleForm.name.trim().length < 2 || roleForm.permissions.length === 0}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
                          >
                            {roleSaving ? 'Creating...' : 'Create role'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
