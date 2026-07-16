'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { createTask } from '@/actions/taskActions'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

export function CreateTaskModal({ 
  action, 
  isAdminTier, 
  isTeamLead, 
  userTeamId, 
  projects, 
  users,
  returnUrl = '/dashboard',
  defaultProjectId = ''
}: { 
  action: string | undefined, 
  isAdminTier: boolean, 
  isTeamLead: boolean, 
  userTeamId: string | null,
  projects: any[],
  users: any[],
  returnUrl?: string,
  defaultProjectId?: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createTask, null)

  useEffect(() => {
    if (state?.success) {
      router.push(`${returnUrl}${returnUrl.includes('?') ? '&' : '?'}toast=Task created successfully!`)
    }
  }, [state?.success, router, returnUrl])

  if (action !== 'new-task' && action !== 'create-task' && action !== 'add-task') return null

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Create New Task</h3>
          <Link href={returnUrl} style={{ color: 'var(--on-surface-variant)' }}>
            <X size={18} />
          </Link>
        </div>
        
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="taskTitle">Task Title</label>
            <input className="form-input" id="taskTitle" name="title" placeholder="Verify SSL certificates" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taskDesc">Description</label>
            <textarea className="form-textarea" id="taskDesc" name="description" placeholder="Specific guidelines..." />
          </div>

          <div className="form-group">
            <label className="form-label">Project</label>
            <select name="projectId" className="form-select" defaultValue={defaultProjectId}>
              <option value="">No Project (General Task)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assignees</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isTeamLead
                ? users.filter(u => u.teamId === userTeamId).map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <input type="checkbox" name="assigneeIds" value={u.id} />
                      {u.name}
                    </label>
                  ))
                : users.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <input type="checkbox" name="assigneeIds" value={u.id} />
                      {u.name} <span style={{ color: 'var(--on-surface-variant)', fontSize: '12px' }}>({u.role.toLowerCase()})</span>
                    </label>
                  ))
              }
              {(!users || users.length === 0) && (
                <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>No users available</div>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
              Select multiple users, or leave all unchecked for an open task.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="priority">Priority</label>
              <select className="form-select" id="priority" name="priority" defaultValue="MEDIUM">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="dueDate">Due Date</label>
              <input className="form-input" id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          {state?.error && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', backgroundColor: 'var(--danger-bg)', padding: '8px 12px', borderRadius: '4px' }}>
              {state.error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href={returnUrl} className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
