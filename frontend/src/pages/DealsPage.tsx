import { useEffect, useState, type DragEvent } from 'react'
import {
  dealService,
  workflowService,
  contactService,
  type Deal,
  type Stage,
  type Contact,
  Permissions,
} from '../services'
import { useAuth } from '../context/AuthContext'
import { PermissionGate } from '../components'

type ViewMode = 'kanban' | 'table'

export function DealsPage() {
  const { hasPermission } = useAuth()
  const canRead = hasPermission(Permissions.DealsRead)
  const canWrite = hasPermission(Permissions.DealsWrite)
  const [deals, setDeals] = useState<Deal[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [formData, setFormData] = useState({ title: '', value: '', contactId: '', stageId: '' })
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)

  useEffect(() => {
    if (!canRead) {
      setLoading(false)
      return
    }
    loadData()
  }, [canRead])

  async function loadData() {
    try {
      const [dealsData, workflowsData, contactsData] = await Promise.all([
        dealService.getAll(),
        workflowService.getAll(),
        contactService.getAll(),
      ])
      setDeals(dealsData)
      setStages(workflowsData[0]?.stages || [])
      setContacts(contactsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm(stageId?: string) {
    setFormData({ title: '', value: '', contactId: '', stageId: stageId || stages[0]?.id || '' })
    setEditingDeal(null)
    setShowForm(true)
  }

  function openEditForm(deal: Deal) {
    setFormData({
      title: deal.title,
      value: deal.value.toString(),
      contactId: deal.contactId || '',
      stageId: deal.stageId || '',
    })
    setEditingDeal(deal)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const data = {
        title: formData.title,
        value: Number(formData.value),
        contactId: formData.contactId || undefined,
        stageId: formData.stageId || undefined,
      }

      if (editingDeal) {
        await dealService.update(editingDeal.id, data)
      } else {
        await dealService.create(data)
      }
      await loadData()
      setShowForm(false)
    } catch (error) {
      console.error('Failed to save deal:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this deal?')) return

    try {
      await dealService.delete(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete deal:', error)
    }
  }

  async function handleStageChange(dealId: string, stageId: string) {
    try {
      // Optimistic update
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stageId } : d))
      await dealService.update(dealId, { stageId })
    } catch (error) {
      console.error('Failed to update deal stage:', error)
      await loadData() // Revert on error
    }
  }

  function getContactName(contactId: string | null) {
    return contacts.find((c) => c.id === contactId)?.name || null
  }

  function getDealsByStage(stageId: string) {
    return deals.filter((d) => d.stageId === stageId)
  }

  function getStageTotal(stageId: string) {
    return getDealsByStage(stageId).reduce((sum, d) => sum + d.value, 0)
  }

  // Drag and drop handlers
  function handleDragStart(e: DragEvent<HTMLDivElement>, deal: Deal) {
    setDraggedDeal(deal)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, stageId: string) {
    e.preventDefault()
    if (draggedDeal && draggedDeal.stageId !== stageId) {
      handleStageChange(draggedDeal.id, stageId)
    }
    setDraggedDeal(null)
  }

  function handleDragEnd() {
    setDraggedDeal(null)
  }

  if (loading) {
    return <div className="text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
          <p className="text-slate-500 mt-1">Track your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-1 bg-white">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Table
            </button>
          </div>
          {canWrite && (
            <button
              onClick={() => openCreateForm()}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700 transition-colors"
            >
              Add Deal
            </button>
          )}
        </div>
      </div>

      <PermissionGate permission={Permissions.DealsRead}>
        {showForm && canWrite && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {editingDeal ? 'Edit Deal' : 'New Deal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Value ($)</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact</label>
                  <select
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No contact</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                  <select
                    value={formData.stageId}
                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No stage</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80 bg-slate-100 rounded-xl"
                onDragOver={canWrite ? handleDragOver : undefined}
                onDrop={canWrite ? (e) => handleDrop(e, stage.id) : undefined}
              >
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color || '#6B7280' }}
                    />
                    <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                    <span className="ml-auto text-sm text-slate-500">
                      {getDealsByStage(stage.id).length}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    ${getStageTotal(stage.id).toLocaleString()}
                  </p>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {getDealsByStage(stage.id).map((deal) => (
                    <div
                      key={deal.id}
                      draggable={canWrite}
                      onDragStart={
                        canWrite ? (e) => handleDragStart(e, deal) : undefined
                      }
                      onDragEnd={canWrite ? handleDragEnd : undefined}
                      className={`bg-white rounded-lg p-4 shadow-sm border-2 transition-all ${
                        canWrite
                          ? 'cursor-grab active:cursor-grabbing'
                          : 'cursor-default'
                      } ${
                        draggedDeal?.id === deal.id
                          ? 'opacity-50 border-indigo-300'
                          : 'border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-slate-900">{deal.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          deal.status === 'won' ? 'bg-green-100 text-green-700' :
                          deal.status === 'lost' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {deal.status}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 mt-2">
                        ${deal.value.toLocaleString()}
                      </p>
                      {getContactName(deal.contactId) && (
                        <p className="text-sm text-slate-500 mt-1">
                          {getContactName(deal.contactId)}
                        </p>
                      )}
                      {canWrite && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => openEditForm(deal)}
                            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="text-red-600 hover:text-red-500 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {canWrite && (
                    <button
                      onClick={() => openCreateForm(stage.id)}
                      className="w-full p-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm font-medium"
                    >
                      + Add Deal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {deals.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No deals yet. Create your first deal!
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900 font-medium">{deal.title}</td>
                      <td className="px-6 py-4 text-slate-600">${deal.value.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{getContactName(deal.contactId) || '-'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={deal.stageId || ''}
                          onChange={(e) => handleStageChange(deal.id, e.target.value)}
                          disabled={!canWrite}
                          className="px-2 py-1 rounded border border-slate-200 text-sm disabled:bg-slate-100"
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          deal.status === 'won' ? 'bg-green-100 text-green-700' :
                          deal.status === 'lost' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {canWrite && (
                          <>
                            <button
                              onClick={() => openEditForm(deal)}
                              className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(deal.id)}
                              className="text-red-600 hover:text-red-500 font-medium text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </PermissionGate>
    </div>
  )
}
