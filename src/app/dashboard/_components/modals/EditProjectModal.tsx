import Link from 'next/link'
import { X } from 'lucide-react'
import { updateProjectAction } from '@/actions/projectActions'
import { redirect } from 'next/navigation'
import { ProjectStatus } from '@prisma/client'

export function EditProjectModal({ 
  action, 
  project, 
  teams 
}: { 
  action: string | undefined, 
  project: any, 
  teams: any[] 
}) {
  if (action !== `edit-project-${project?.id}` || !project) return null

  async function handleUpdateProject(formData: FormData) {
    'use server'
    formData.append('projectId', project.id)
    const result = await updateProjectAction(null, formData)
    if (result?.error) {
      throw new Error(result.error)
    }
    // Extract the base path to redirect to
    // We assume the user might be on /projects or /project/[id]
    redirect(project.id ? `/project/${project.id}` : '/projects')
  }

  // Format dates for input[type="date"]
  const startDateStr = project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''
  const dueDateStr = project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : ''

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Edit Project</h3>
          <Link href={`/project/${project.id}`} style={{ color: 'var(--on-surface-variant)' }}>
            <X size={18} />
          </Link>
        </div>
        
        <form action={handleUpdateProject} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
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
            <Link href={`/project/${project.id}`} className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}
