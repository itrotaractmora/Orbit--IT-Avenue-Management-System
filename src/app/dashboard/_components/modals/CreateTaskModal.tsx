import Link from 'next/link'
import { X } from 'lucide-react'
import { createTask } from '@/actions/taskActions'
import { redirect } from 'next/navigation'

export function CreateTaskModal({ 
  action, 
  isAdminTier, 
  isTeamLead, 
  userTeamId, 
  projects, 
  users 
}: { 
  action: string | undefined, 
  isAdminTier: boolean, 
  isTeamLead: boolean, 
  userTeamId: string | null,
  projects: any[],
  users: any[]
}) {
  if (action !== 'new-task' || (!isAdminTier && !isTeamLead)) return null

  async function handleCreateTask(formData: FormData) {
    'use server'
    await createTask(null, formData)
    redirect('/dashboard')
  }

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Create New Task</h3>
          <Link href="/dashboard" style={{ color: 'var(--on-surface-variant)' }}>
            <X size={18} />
          </Link>
        </div>
        
        <form action={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="taskTitle">Task Title</label>
            <input className="form-input" id="taskTitle" name="title" placeholder="Verify SSL certificates" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taskDesc">Description</label>
            <textarea className="form-textarea" id="taskDesc" name="description" placeholder="Specific guidelines..." />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="projectId">Project Scope</label>
            <select className="form-select" id="projectId" name="projectId">
              <option value="">Standalone Task (No Project)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="assignedToId">Assignee</label>
            <select className="form-select" id="assignedToId" name="assignedToId">
              <option value="">Leave Unassigned (Open to Claim)</option>
              {isTeamLead
                ? users.filter(u => u.teamId === userTeamId).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))
                : users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.toLowerCase()})</option>
                  ))
              }
            </select>
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

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href="/dashboard" className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  )
}
