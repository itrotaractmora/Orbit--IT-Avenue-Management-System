import { prisma } from '@/utils/prisma'
import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderOpen, Calendar, Briefcase, CheckCircle2, AlertCircle, Share2, User as UserIcon } from 'lucide-react'
import { TaskStatus, ProjectStatus } from '@prisma/client'
import { CopyLinkButton } from '@/app/profile/[id]/_components/CopyLinkButton'

export default async function ProjectProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect('/login')
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      team: { include: { lead: true, coDirector: true, members: true } },
      tasks: {
        include: { assignee: true }
      }
    }
  })

  if (!project) {
    return (
      <div className="empty-state" style={{ marginTop: 'var(--spacing-32)' }}>
        <h2 className="section-title">Project Not Found</h2>
        <p className="body-text">The project you are looking for does not exist.</p>
        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 'var(--spacing-16)' }}>Return to Dashboard</Link>
      </div>
    )
  }

  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.status === TaskStatus.COMPLETED).length
  const overdueTasks = project.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.COMPLETED).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)', maxWidth: '1000px', margin: '0 auto', paddingTop: 'var(--spacing-24)' }}>
      
      {/* Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ display: 'flex', gap: 'var(--spacing-8)', height: '36px', padding: '0 12px', fontSize: '14px' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <CopyLinkButton url={`http://localhost:3000/project/${project.id}`} />
      </div>

      {/* Project Card */}
      <div className="card" style={{ display: 'flex', gap: 'var(--spacing-24)', alignItems: 'center' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '16px',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <FolderOpen size={36} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 var(--spacing-8) 0', color: 'var(--on-surface)' }}>
                {project.title}
              </h1>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginBottom: 'var(--spacing-12)' }}>
                {project.description}
              </p>
            </div>
            <span className={`chip chip-${
              project.status === ProjectStatus.ACTIVE ? 'success' : project.status === ProjectStatus.COMPLETED ? 'info' : 'neutral'
            }`}>
              {project.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-16)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
              <Briefcase size={14} />
              <span>{project.team?.name || 'Cross-Division'}</span>
            </div>
            {project.team?.lead && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                <UserIcon size={14} />
                <span>Lead: <Link href={`/profile/${project.team.lead.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{project.team.lead.name}</Link></span>
              </div>
            )}
            {project.team?.coDirector && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                <UserIcon size={14} />
                <span>Director: <Link href={`/profile/${project.team.coDirector.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{project.team.coDirector.name}</Link></span>
              </div>
            )}
            {project.startDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                <Calendar size={14} />
                <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
              </div>
            )}
            {project.dueDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                <AlertCircle size={14} />
                <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contribution Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-16)' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-24)' }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)' }}>{totalTasks}</div>
          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-4)' }}>Total Tasks</div>
        </div>
        
        <div className="card" style={{ borderLeft: '4px solid var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-24)' }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)' }}>{completedTasks}</div>
          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-4)' }}>Completed</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-24)' }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)' }}>{overdueTasks}</div>
          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-4)' }}>Overdue</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--warning)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-24)' }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)' }}>{completionRate}%</div>
          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-4)' }}>Progress</div>
        </div>
      </div>

      {/* Project Members */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 'var(--spacing-16)' }}>Assigned Members</h3>
        {(!project.team?.members || project.team.members.length === 0) ? (
          <div className="empty-state">
            <p className="empty-state-description">No members are currently assigned to this team.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--spacing-12)', flexWrap: 'wrap' }}>
            {project.team.members.map((member: any) => (
              <Link key={member.id} href={`/profile/${member.id}`} className="chip" style={{ backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <span style={{ fontWeight: 500 }}>{member.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Project Tasks */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 'var(--spacing-16)' }}>Project Task Breakdown</h3>
        {project.tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-description">No tasks have been created for this project yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {project.tasks.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.title}</td>
                  <td>
                    {t.assignee ? (
                      <Link href={`/profile/${t.assigneeId}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                          {t.assignee.name.substring(0, 2).toUpperCase()}
                        </div>
                        {t.assignee.name}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--on-surface-variant)' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className={`chip chip-${
                      t.priority === 'URGENT' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'info'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className="chip" style={{ backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)' }}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="body-text">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
