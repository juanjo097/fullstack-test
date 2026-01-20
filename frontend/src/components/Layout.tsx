import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Permissions } from '../services'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/contacts', label: 'Contacts', permission: Permissions.ContactsRead },
  { to: '/deals', label: 'Deals', permission: Permissions.DealsRead },
  { to: '/workflows', label: 'Workflows', permission: Permissions.WorkflowsRead },
  { to: '/settings', label: 'Settings', permission: Permissions.OrganizationRead },
]

export function Layout() {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-slate-900">CRM</h1>
            <nav className="flex gap-1">
              {navItems
                .filter((item) => !item.permission || hasPermission(item.permission))
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

    </div>
  )
}
