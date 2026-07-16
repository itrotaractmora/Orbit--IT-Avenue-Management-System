'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { onboardUser } from '@/actions/userActions'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

export function OnboardModal({ 
  action, 
  isExecutive, 
  isCoDirector, 
  isTeamLead, 
  userRole, 
  userTeamId, 
  teams 
}: { 
  action: string | undefined, 
  isExecutive: boolean, 
  isCoDirector: boolean, 
  isTeamLead: boolean, 
  userRole: string, 
  userTeamId: string | null,
  teams: any[] 
}) {
  const router = useRouter()
  const canOnboard = isExecutive || isCoDirector || isTeamLead
  const [state, formAction, isPending] = useActionState(onboardUser, null)

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard')
    }
  }, [state, router])

  if (action !== 'new-employee' || !canOnboard) return null

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Onboard New Employee</h3>
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
            <label className="form-label" htmlFor="name">Full Name</label>
            <input className="form-input" id="name" name="name" placeholder="Alex Johnson" required />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input className="form-input" id="email" name="email" type="email" placeholder="name@itavenue.com" required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Workspace Role</label>
            <select className="form-select" id="role" name="role" required>
              {userRole === UserRole.PRESIDENT && (
                <>
                  <option value="SENIOR_DIRECTOR">Senior Director</option>
                  <option value="CO_DIRECTOR">Co-Director</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="MEMBER">Team Member</option>
                </>
              )}
              {userRole === UserRole.SENIOR_DIRECTOR && (
                <>
                  <option value="SENIOR_DIRECTOR">Senior Director</option>
                  <option value="CO_DIRECTOR">Co-Director</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="MEMBER">Team Member</option>
                </>
              )}
              {userRole === UserRole.CO_DIRECTOR && (
                <>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="MEMBER">Team Member</option>
                </>
              )}
              {userRole === UserRole.TEAM_LEAD && (
                <option value="MEMBER">Team Member</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="teamId">Assign to Team (Optional)</label>
            <select className="form-select" id="teamId" name="teamId">
              <option value="">No Team (Cross-Division)</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {userRole === UserRole.TEAM_LEAD && (
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                Note: You can only onboard members to your own team.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href="/dashboard" className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={isPending}>
              {isPending ? 'Onboarding...' : 'Onboard Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
