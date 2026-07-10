import { prisma } from '@/utils/prisma'
import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User as UserIcon, Mail, Briefcase, Award, CheckCircle2 } from 'lucide-react'
import { TaskStatus } from '@prisma/client'
import { CopyLinkButton } from './_components/CopyLinkButton'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect('/login')
  }

  const { id } = await params

  const profileUser = await prisma.user.findUnique({
    where: { id },
    include: {
      team: true,
      assignedTasks: {
        include: { project: true }
      },
      approvedTasks: true
    }
  })

  if (!profileUser) {
    return (
      <div className="empty-state" style={{ marginTop: 'var(--spacing-32)' }}>
        <h2 className="section-title">User Not Found</h2>
        <p className="body-text">The profile you are looking for does not exist.</p>
        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 'var(--spacing-16)' }}>Return to Dashboard</Link>
      </div>
    )
  }

  const completedTasks = profileUser.assignedTasks.filter(t => t.status === TaskStatus.COMPLETED)
  const openTasks = profileUser.assignedTasks.filter(t => t.status === TaskStatus.OPEN || t.status === TaskStatus.IN_PROGRESS)
  const approvalRate = profileUser.assignedTasks.length > 0 
    ? Math.round((completedTasks.length / profileUser.assignedTasks.length) * 100) 
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)', maxWidth: '1000px', margin: '0 auto', paddingTop: 'var(--spacing-24)' }}>
      
      {/* Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ display: 'flex', gap: 'var(--spacing-8)', height: '36px', padding: '0 12px', fontSize: '14px' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <CopyLinkButton url={`http://localhost:3000/profile/${profileUser.id}`} />
      </div>

      {/* Profile Card */}
      <div className="card" style={{ display: 'flex', gap: 'var(--spacing-24)', alignItems: 'center' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          fontSize: '32px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {profileUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 var(--spacing-8) 0', color: 'var(--on-surface)' }}>
            {profileUser.name}
          </h1>
          <div style={{ display: 'flex', gap: 'var(--spacing-16)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
              <UserIcon size={16} />
              <span style={{ textTransform: 'capitalize' }}>{profileUser.role.replace('_', ' ').toLowerCase()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
              <Briefcase size={16} />
              <span>{profileUser.team?.name || 'No Team Assigned'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
              <Mail size={16} />
              <span>{profileUser.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-16)' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-24)' }}>
          <div style={{ color: 'var(--success)', marginBottom: 'var(--spacing-8)' }}><CheckCircle2 size={32} /></div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)' }}>{completedTasks.length}</div>
          <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-4)' }}>Tasks Completed</div>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-24)' }}>
          <div style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-8)' }}><Briefcase size={32} /></div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)' }}>{openTasks.length}</div>
          <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-4)' }}>Active Workload</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--warning)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-24)' }}>
          <div style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-8)' }}><Award size={32} /></div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)' }}>{approvalRate}%</div>
          <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-4)' }}>Approval Rate</div>
        </div>
      </div>

      {/* Historical Tasks */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 'var(--spacing-16)' }}>Contribution History</h3>
        {completedTasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-description">No completed tasks yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Project</th>
                <th>Completed On</th>
              </tr>
            </thead>
            <tbody>
              {completedTasks.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.title}</td>
                  <td className="body-text">{t.project?.title || 'General Task'}</td>
                  <td className="body-text">{new Date(t.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
