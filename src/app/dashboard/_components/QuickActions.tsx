import Link from 'next/link'
import { Settings, UserPlus, Users, FolderPlus, Plus } from 'lucide-react'

export function QuickActions({ isExecutive, isCoDirector, isTeamLead }: { isExecutive: boolean, isCoDirector: boolean, isTeamLead: boolean }) {
  const isAdminTier = isExecutive || isCoDirector

  return (
    <>
      {/* Quick Actions Panel */}
      {isAdminTier && (
        <div className="card" style={{ border: '1px solid rgba(200, 24, 90, 0.12)' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            <span>Quick Actions</span>
          </h3>
          <div className="quick-actions-grid">
            <Link href="/dashboard?action=new-employee" className="quick-action-btn">
              <UserPlus size={16} />
              <span>New Employee</span>
            </Link>
            {isExecutive && (
              <Link href="/dashboard?action=create-team" className="quick-action-btn">
                <Users size={16} />
                <span>Create Team</span>
              </Link>
            )}
            <Link href="/dashboard?action=create-project" className="quick-action-btn">
              <FolderPlus size={16} />
              <span>Create Project</span>
            </Link>
            <Link href="/dashboard?action=new-task" className="quick-action-btn">
              <Plus size={16} />
              <span>New Task</span>
            </Link>
          </div>
        </div>
      )}

      {/* Scoped Quick Actions for Team Lead */}
      {isTeamLead && (
        <div className="card" style={{ border: '1px solid rgba(200, 24, 90, 0.12)' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
            <Settings size={18} style={{ color: 'var(--primary)' }} />
            <span>Team Actions</span>
          </h3>
          <div className="quick-actions-grid" style={{ gridTemplateColumns: '1fr' }}>
            <Link href="/dashboard?action=new-employee" className="quick-action-btn">
              <UserPlus size={16} />
              <span>New Team Member</span>
            </Link>
            <Link href="/dashboard?action=new-task" className="quick-action-btn">
              <Plus size={16} />
              <span>Create Team Task</span>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
