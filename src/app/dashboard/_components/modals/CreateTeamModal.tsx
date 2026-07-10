import Link from 'next/link'
import { X } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { createTeam } from '@/actions/userActions'
import { redirect } from 'next/navigation'

export function CreateTeamModal({ action, isExecutive, users }: { action: string | undefined, isExecutive: boolean, users: any[] }) {
  if (action !== 'create-team' || !isExecutive) return null

  async function handleCreateTeam(formData: FormData) {
    'use server'
    await createTeam(null, formData)
    redirect('/dashboard')
  }

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Create IT Department Team</h3>
          <Link href="/dashboard" style={{ color: 'var(--on-surface-variant)' }}>
            <X size={18} />
          </Link>
        </div>
        
        <form action={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="teamName">Team Name</label>
            <input className="form-input" id="teamName" name="name" placeholder="Network Infrastructure Team" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="coDirectorId">Overseeing Co-Director</label>
            <select className="form-select" id="coDirectorId" name="coDirectorId">
              <option value="">Select Overseeing Co-Director...</option>
              {users.filter(u => u.role === UserRole.CO_DIRECTOR).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href="/dashboard" className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit">Create Team</button>
          </div>
        </form>
      </div>
    </div>
  )
}
