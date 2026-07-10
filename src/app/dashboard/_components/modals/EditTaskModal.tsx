'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { updateTaskAction } from '@/actions/taskActions'
import { useRouter } from 'next/navigation'
import { TaskStatus, TaskPriority } from '@prisma/client'
import { useActionState, useEffect } from 'react'

export function EditTaskModal({ 
  action, 
  task, 
  projects,
  users,
  returnUrl = '/dashboard'
}: { 
  action: string | undefined, 
  task: any, 
  projects: any[],
  users: any[],
  returnUrl?: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(updateTaskAction, null)

  useEffect(() => {
    if (state?.success) {
      router.push(`${returnUrl}${returnUrl.includes('?') ? '&' : '?'}toast=Task updated successfully!`)
    }
  }, [state?.success, router, returnUrl])

  if (action !== `edit-task-${task?.id}` || !task) return null

  const dueDateStr = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Edit Task</h3>
          <Link href={returnUrl} style={{ color: 'var(--on-surface-variant)' }}>
            <X size={18} />
          </Link>
        </div>
        
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <input type="hidden" name="taskId" value={task.id} />
          
          <div className="form-group">
            <label className="form-label" htmlFor="taskTitle">Task Title</label>
            <input className="form-input" id="taskTitle" name="title" defaultValue={task.title} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taskDesc">Description</label>
            <textarea className="form-textarea" id="taskDesc" name="description" defaultValue={task.description || ''} />
          </div>

          <div className="form-group">
            <label className="form-label">Project</label>
            <select name="projectId" className="form-select" defaultValue={task.projectId || ''}>
              <option value="">No Project (General Task)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="assignedToId">Assignee</label>
            <select className="form-select" id="assignedToId" name="assignedToId" defaultValue={task.assignedToId || ''}>
              <option value="">Leave Unassigned (Open to Claim)</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role.toLowerCase()})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="priority">Priority</label>
              <select className="form-select" id="priority" name="priority" defaultValue={task.priority}>
                {Object.values(TaskPriority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="status">Status</label>
              <select className="form-select" id="status" name="status" defaultValue={task.status}>
                {Object.values(TaskStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dueDate">Due Date</label>
            <input className="form-input" id="dueDate" name="dueDate" type="date" defaultValue={dueDateStr} />
          </div>

          {state?.error && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', backgroundColor: 'var(--danger-bg)', padding: '8px 12px', borderRadius: '4px' }}>
              {state.error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href={returnUrl} className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
