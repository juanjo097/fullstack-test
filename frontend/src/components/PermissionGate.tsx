import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Permission } from '../services'

interface PermissionGateProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const { hasPermission } = useAuth()

  if (!hasPermission(permission)) {
    return (
      fallback ?? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
          You do not have permission to access this section.
        </div>
      )
    )
  }

  return <>{children}</>
}
