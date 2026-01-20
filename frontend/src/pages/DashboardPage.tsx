import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { contactService, dealService, workflowService, type Deal, Permissions } from '../services'

export function DashboardPage() {
  const { user, hasPermission } = useAuth()
  const canReadContacts = hasPermission(Permissions.ContactsRead)
  const canReadDeals = hasPermission(Permissions.DealsRead)
  const canReadWorkflows = hasPermission(Permissions.WorkflowsRead)
  const [stats, setStats] = useState({ contacts: 0, deals: 0, workflows: 0, totalValue: 0 })
  const [recentDeals, setRecentDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [contacts, deals, workflows] = await Promise.all([
          canReadContacts ? contactService.getAll() : Promise.resolve([]),
          canReadDeals ? dealService.getAll() : Promise.resolve([]),
          canReadWorkflows ? workflowService.getAll() : Promise.resolve([]),
        ])

        const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)

        setStats({
          contacts: contacts.length,
          deals: deals.length,
          workflows: workflows.length,
          totalValue,
        })

        setRecentDeals(deals.slice(0, 5))
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [canReadContacts, canReadDeals, canReadWorkflows])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your CRM today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {canReadContacts && <StatCard title="Total Contacts" value={stats.contacts} icon="👥" />}
        {canReadDeals && <StatCard title="Total Deals" value={stats.deals} icon="📊" />}
        {canReadWorkflows && <StatCard title="Workflows" value={stats.workflows} icon="⚡" />}
        <StatCard
          title="Pipeline Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          icon="💰"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canReadDeals && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Deals</h2>
              <Link to="/deals" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                View all
              </Link>
            </div>
            {recentDeals.length === 0 ? (
              <p className="text-slate-500 text-sm">No deals yet. Create your first deal!</p>
            ) : (
              <div className="space-y-3">
                {recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900">{deal.title}</p>
                      <p className="text-sm text-slate-500">{deal.status}</p>
                    </div>
                    <span className="font-semibold text-slate-900">${deal.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {canReadContacts && (
              <Link
                to="/contacts"
                className="p-4 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
              >
                <span className="text-2xl">👤</span>
                <p className="mt-2 text-sm font-medium text-slate-700">Add Contact</p>
              </Link>
            )}
            {canReadDeals && (
              <Link
                to="/deals"
                className="p-4 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
              >
                <span className="text-2xl">📝</span>
                <p className="mt-2 text-sm font-medium text-slate-700">Create Deal</p>
              </Link>
            )}
            {canReadWorkflows && (
              <Link
                to="/workflows"
                className="p-4 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
              >
                <span className="text-2xl">⚙️</span>
                <p className="mt-2 text-sm font-medium text-slate-700">Manage Pipeline</p>
              </Link>
            )}
            <Link
              to="/settings"
              className="p-4 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
            >
              <span className="text-2xl">🏢</span>
              <p className="mt-2 text-sm font-medium text-slate-700">Organization</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
