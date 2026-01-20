import { useEffect, useState } from 'react'
import { workflowService, type Workflow, type Stage, Permissions } from '../services'
import { useAuth } from '../context/AuthContext'
import { PermissionGate } from '../components'

export function WorkflowsPage() {
  const { hasPermission } = useAuth()
  const canRead = hasPermission(Permissions.WorkflowsRead)
  const canWrite = hasPermission(Permissions.WorkflowsWrite)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  useEffect(() => {
    if (!canRead) {
      setLoading(false)
      return
    }
    loadWorkflows()
  }, [canRead])

  async function loadWorkflows() {
    try {
      const data = await workflowService.getAll()
      setWorkflows(data)
      if (data.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(data[0])
      }
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddStage() {
    if (!selectedWorkflow) return

    const name = prompt('Stage name:')
    if (!name) return

    try {
      const maxOrder = Math.max(0, ...selectedWorkflow.stages.map((s) => s.order))
      await workflowService.addStage(selectedWorkflow.id, {
        name,
        order: maxOrder + 1,
        color: '#6B7280',
      })
      await loadWorkflows()
      const updated = await workflowService.getById(selectedWorkflow.id)
      setSelectedWorkflow(updated)
    } catch (error) {
      console.error('Failed to add stage:', error)
    }
  }

  async function handleDeleteStage(stageId: string) {
    if (!selectedWorkflow) return
    if (!confirm('Delete this stage?')) return

    try {
      await workflowService.deleteStage(selectedWorkflow.id, stageId)
      await loadWorkflows()
      const updated = await workflowService.getById(selectedWorkflow.id)
      setSelectedWorkflow(updated)
    } catch (error) {
      console.error('Failed to delete stage:', error)
    }
  }

  async function handleUpdateStageName(stage: Stage) {
    if (!selectedWorkflow) return

    const name = prompt('New stage name:', stage.name)
    if (!name || name === stage.name) return

    try {
      await workflowService.updateStage(selectedWorkflow.id, stage.id, { name })
      await loadWorkflows()
      const updated = await workflowService.getById(selectedWorkflow.id)
      setSelectedWorkflow(updated)
    } catch (error) {
      console.error('Failed to update stage:', error)
    }
  }

  if (loading) {
    return <div className="text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
        <p className="text-slate-500 mt-1">Manage your sales pipeline stages</p>
      </div>

      <PermissionGate permission={Permissions.WorkflowsRead}>
        {workflows.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-slate-500">
            No workflows found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="text-sm font-medium text-slate-500 uppercase mb-3">Pipelines</h2>
              <div className="space-y-2">
                {workflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() => setSelectedWorkflow(workflow)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedWorkflow?.id === workflow.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {workflow.name}
                    <span className="ml-2 text-sm text-slate-400">
                      ({workflow.stages.length} stages)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              {selectedWorkflow ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">{selectedWorkflow.name}</h2>
                    {canWrite && (
                      <button
                        onClick={handleAddStage}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700"
                      >
                        Add Stage
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedWorkflow.stages.map((stage, index) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-slate-200"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color || '#6B7280' }}
                        />
                        <span className="text-slate-500 text-sm w-8">{index + 1}.</span>
                        <span className="flex-1 font-medium text-slate-900">{stage.name}</span>
                        {canWrite && (
                          <>
                            <button
                              onClick={() => handleUpdateStageName(stage)}
                              className="text-slate-400 hover:text-indigo-600 text-sm"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => handleDeleteStage(stage.id)}
                              className="text-slate-400 hover:text-red-600 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedWorkflow.stages.length === 0 && (
                    <p className="text-slate-500 text-center py-8">
                      No stages yet. Add your first stage!
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-center py-8">Select a workflow</p>
              )}
            </div>
          </div>
        )}
      </PermissionGate>
    </div>
  )
}
