import Link from 'next/link'
import { X } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { onboardUser } from '@/actions/userActions'
import { redirect } from 'next/navigation'

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
  const canOnboard = isExecutive || isCoDirector || isTeamLead
  if (action !== 'new-employee' || !canOnboard) return null

  async function handleOnboard(formData: FormData) {
    'use server'
    await onboardUser(null, formData)
    redirect('/dashboard')
  }

  return (
    <div className="glass-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Onboard New Employee</h3>
          <Link href="/dashboard" style={{ color: 'var(--on-surface-variant)' }}>
            <X size={18} />
          </Link>
        </div>
        
        <form action={handleOnboard} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
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
                </>
              )}
              {isExecutive && userRole !== UserRole.PRESIDENT && (
                <option value="CO_DIRECTOR">Co-Director</option>
              )}
              {(isExecutive || isCoDirector) && (
                <option value="TEAM_LEAD">Team Lead</option>
              )}
              <option value="MEMBER">Team Member</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="teamId">Assigned Team</label>
            {isTeamLead ? (
              // Team Leads can only add to their own team
              <>
                <input type="hidden" name="teamId" value={userTeamId || ''} />
                <select className="form-select" disabled>
                  <option>{teams.find(t => t.id === userTeamId)?.name || 'Your Team'}</option>
                </select>
              </>
            ) : (
              <select className="form-select" id="teamId" name="teamId">
                <option value="">No Team Assigned</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href="/dashboard" className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit">Onboard Employee</button>
          </div>
        </form>
      </div>
    </div>
  )
}
