'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { createProject } from '@/actions/projectActions'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

export function CreateProjectModal({ action, isAdminTier, teams }: { action: string | undefined, isAdminTier: boolean, teams: any[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createProject, null)

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard')
    }
  }, [state, router])

  if (action !== 'create-project' || !isAdminTier) return null

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Create New Project</h3>
          <Link href="/dashboard" style={{ color: 'var(--on-surface-variant)' }}>
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
            <input className="form-input" id="projectTitle" name="title" placeholder="Database Migration 2026" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="projectDesc">Description</label>
            <textarea className="form-textarea" id="projectDesc" name="description" placeholder="Technical migration documentation..." />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="teamId">Assigned Team</label>
            <select className="form-select" id="teamId" name="teamId">
              <option value="">Select Team...</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="startDate">Start Date</label>
              <input className="form-input" id="startDate" name="startDate" type="date" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="dueDate">Due Date</label>
              <input className="form-input" id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href="/dashboard" className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
