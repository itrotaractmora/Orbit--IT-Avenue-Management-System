'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { UserRole } from '@/lib/enums'
import { createTeam } from '@/actions/userActions'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

export function CreateTeamModal({ action, isExecutive, users }: { action: string | undefined, isExecutive: boolean, users: any[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createTeam, null)

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard')
    }
  }, [state, router])

  if (action !== 'create-team' || !isExecutive) return null

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Create IT Department Team</h3>
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
            <button className="btn btn-primary" type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
