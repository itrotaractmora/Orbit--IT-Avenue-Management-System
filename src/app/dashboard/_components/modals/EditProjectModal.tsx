'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { updateProjectAction } from '@/actions/projectActions'
import { useRouter } from 'next/navigation'
import { ProjectStatus } from '@prisma/client'
import { useActionState, useEffect } from 'react'

export function EditProjectModal({ 
  action, 
  project, 
  teams,
  returnUrl
}: { 
  action: string | undefined, 
  project: any, 
  teams: any[],
  returnUrl?: string
}) {
  const router = useRouter()
  const baseReturnUrl = returnUrl || (project?.id ? `/project/${project.id}` : '/projects')

  // Wrap updateProjectAction to inject projectId from the closure
  async function handleUpdateProject(prevState: any, formData: FormData) {
    formData.append('projectId', project.id)
    return updateProjectAction(prevState, formData)
  }

  const [state, formAction, isPending] = useActionState(handleUpdateProject, null)

  useEffect(() => {
    if (state?.success) {
      router.push(baseReturnUrl)
    }
  }, [state, router, baseReturnUrl])

  if (action !== `edit-project-${project?.id}` || !project) return null

  // Format dates for input[type="date"]
  const startDateStr = project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''
  const dueDateStr = project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : ''

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Edit Project</h3>
          <Link href={baseReturnUrl} style={{ color: 'var(--on-surface-variant)' }}>
            <X size={18} />
          </Link>
        </div>

        {state?.error && (
          <div style={{ padding: '12px', backgroundColor: 'var(--error-bg, #fee2e2)', color: 'var(--error-text, #dc2626)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid var(--error-border, #f87171)' }}>
            {state.error}
          </div>
        )}
        
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="projectTitle">Project Title</label>
            <input className="form-input" id="projectTitle" name="title" defaultValue={project.title} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="projectDesc">Description</label>
            <textarea className="form-textarea" id="projectDesc" name="description" defaultValue={project.description || ''} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">Status</label>
            <select className="form-select" id="status" name="status" defaultValue={project.status}>
              {Object.values(ProjectStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="teamId">Assigned Team</label>
            <select className="form-select" id="teamId" name="teamId" defaultValue={project.teamId || ''}>
              <option value="">Cross-Division (No Team)</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="startDate">Start Date</label>
              <input className="form-input" id="startDate" name="startDate" type="date" defaultValue={startDateStr} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="dueDate">Due Date</label>
              <input className="form-input" id="dueDate" name="dueDate" type="date" defaultValue={dueDateStr} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href={baseReturnUrl} className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
