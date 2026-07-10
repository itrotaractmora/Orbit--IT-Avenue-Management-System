import { prisma } from '@/utils/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TaskStatus } from '@prisma/client'
import { CheckCircle2, TrendingUp, Briefcase, ArrowLeft, Award, FileText } from 'lucide-react'
import { getSessionUser } from '@/actions/authActions'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  
  // Verify that the viewer is authenticated (org-restricted access)
  const viewer = await getSessionUser()
  if (!viewer) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        padding: 'var(--spacing-16)'
      }}>
        <div className="card" style={{
          width: '100%',
          maxWidth: '450px',
          padding: 'var(--spacing-32)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-16)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(200, 24, 90, 0.05)',
            color: 'var(--primary)'
          }}>
            <Award size={24} />
          </div>
          <div>
            <h2 className="card-title" style={{ fontSize: '20px', fontWeight: 700 }}>Private Profile</h2>
            <p className="body-text" style={{ fontSize: '14px', marginTop: 'var(--spacing-8)' }}>
              This profile is restricted to authenticated IT Avenue users. Please sign in to view this contributor's portfolio.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-8)' }}>
            Sign In to View
          </Link>
        </div>
      </div>
    )
  }

  // Query the user profile
  const profileUser = await prisma.user.findUnique({
    where: { id },
    include: {
      team: true,
      assignedTasks: {
        include: { project: true, approvals: { include: { decidedBy: true } } },
        orderBy: { updatedAt: 'desc' }
      }
    }
  })

  if (!profileUser) {
    notFound()
  }

  const tasks = profileUser.assignedTasks
  const totalTasksAssigned = tasks.length
  
  // Workload: IN_PROGRESS or OPEN tasks
  const currentWorkload = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.OPEN).length
  
  // Completed tasks
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED)
  const completedCount = completedTasks.length

  // Calculate approval rate
  let totalDecisions = 0
  let approvedDecisions = 0
  tasks.forEach(t => {
    t.approvals.forEach(a => {
      totalDecisions++
      if (a.decision === 'APPROVED') {
        approvedDecisions++
      }
    })
  })
  const approvalRate = totalDecisions > 0 ? Math.round((approvedDecisions / totalDecisions) * 100) : 100

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      padding: 'var(--spacing-48) var(--spacing-40)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-32)'
      }}>
        
        {/* Return Button */}
        <div style={{ alignSelf: 'flex-start' }}>
          <Link href="/dashboard" className="btn btn-secondary" style={{ display: 'inline-flex', gap: 'var(--spacing-8)', height: '36px', padding: '0 var(--spacing-12)', fontSize: '13px' }}>
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-16)',
          borderLeft: '4px solid var(--primary)',
          padding: 'var(--spacing-24) var(--spacing-32)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
              <h1 className="page-title-text" style={{ fontSize: '30px' }}>{profileUser.name}</h1>
              <span className="chip chip-success" style={{ fontSize: '9px' }}>
                {profileUser.status}
              </span>
            </div>
            <p className="body-text" style={{ marginTop: '2px' }}>{profileUser.email}</p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-32)', flexWrap: 'wrap', marginTop: 'var(--spacing-8)' }}>
            <div>
              <div className="label-caps" style={{ color: '#a0a0a0' }}>Division Role</div>
              <div style={{ fontWeight: 600, fontSize: '14px', textTransform: 'uppercase', color: 'var(--primary)', marginTop: '4px' }}>
                {profileUser.role.replace('_', ' ')}
              </div>
            </div>
            {profileUser.team && (
              <div>
                <div className="label-caps" style={{ color: '#a0a0a0' }}>Assigned Team</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)', marginTop: '4px' }}>
                  {profileUser.team.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contribution Metrics Grid */}
        <div className="grid-dashboard">
          <div className="card col-4 stat-card">
            <div className="stat-label">Tasks Completed</div>
            <div className="stat-value">{completedCount}</div>
            <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
              <span>Verified finished tasks</span>
            </div>
          </div>

          <div className="card col-4 stat-card">
            <div className="stat-label">Approval Rate</div>
            <div className="stat-value" style={{ color: approvalRate >= 80 ? 'var(--success)' : 'var(--warning)' }}>
              {approvalRate}%
            </div>
            <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} style={{ color: approvalRate >= 80 ? 'var(--success)' : 'var(--warning)' }} />
              <span>Based on {totalDecisions} reviews</span>
            </div>
          </div>

          <div className="card col-4 stat-card">
            <div className="stat-label">Current Workload</div>
            <div className="stat-value" style={{ color: currentWorkload > 3 ? 'var(--warning)' : 'var(--info)' }}>
              {currentWorkload}
            </div>
            <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Briefcase size={12} style={{ color: currentWorkload > 3 ? 'var(--warning)' : 'var(--info)' }} />
              <span>Active tasks in queue</span>
            </div>
          </div>
        </div>

        {/* Contribution Log */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} />
            <span>Completed Contributions</span>
          </h2>
          
          {completedCount === 0 ? (
            <div className="empty-state" style={{ border: 'none', padding: 'var(--spacing-32)' }}>
              <div className="empty-state-icon" style={{ padding: '8px' }}>
                <Award size={18} />
              </div>
              <div className="empty-state-title" style={{ fontSize: '14px' }}>No completed contributions yet</div>
              <div className="empty-state-description" style={{ fontSize: '12px' }}>This employee has not finished any tasks.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Approval Date</th>
                    <th>Approver</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTasks.map(t => {
                    const finalApproval = t.approvals.find(a => a.decision === 'APPROVED')
                    return (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{t.description}</div>
                        </td>
                        <td className="body-text">{t.project?.title || 'General Task'}</td>
                        <td className="body-text">{finalApproval ? new Date(finalApproval.decidedAt).toLocaleDateString() : 'Unknown'}</td>
                        <td className="body-text">{finalApproval?.decidedBy?.name || 'System Auto-approved'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#a0a0a0', fontSize: '12px' }}>
          IT Avenue Member Profile Page. Shared portfolio verified by Supabase Auth integration.
        </div>

      </div>
    </div>
  )
}
