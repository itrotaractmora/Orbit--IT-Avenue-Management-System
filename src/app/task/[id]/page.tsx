import { getSessionUser } from '@/actions/authActions'
import { prisma } from '@/utils/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, FileText, CheckSquare } from 'lucide-react'
import { CommentFeed } from './_components/CommentFeed'
import { UserRole } from '@/lib/enums'
import Image from 'next/image'

export default async function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      assignees: true,
      creator: true,
      approver: true,
      comments: {
        include: { user: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!task) {
    return (
      <div style={{ padding: 'var(--spacing-32)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Task Not Found</h1>
        <p style={{ color: 'var(--on-surface-variant)', marginTop: '8px' }}>The task you are looking for does not exist or has been deleted.</p>
        <Link href="/dashboard" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>Back to Dashboard</Link>
      </div>
    )
  }

  // Basic access control: If not admin/lead and not creator/assignee, maybe deny? 
  // For this club system, members can usually see open general tasks, or project tasks they are members of.
  // We will allow viewing if they have the URL for simplicity in a collaborative environment,
  // but actions (edit/delete) are restricted at the action level.

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'var(--danger)'
      case 'HIGH': return 'var(--warning)'
      case 'LOW': return 'var(--info)'
      default: return 'var(--primary)'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'var(--success)'
      case 'REJECTED': return 'var(--danger)'
      case 'PENDING_APPROVAL': return 'var(--warning)'
      case 'IN_PROGRESS': return 'var(--info)'
      default: return 'var(--on-surface-variant)' // OPEN
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: 'var(--spacing-24)', paddingBottom: 'var(--spacing-32)', height: 'calc(100vh - var(--header-height, 0px))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)', marginBottom: 'var(--spacing-24)' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ height: '36px', padding: '0 12px', fontSize: '14px', display: 'flex', gap: '8px' }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckSquare size={24} color={getStatusColor(task.status)} />
          {task.title}
        </h1>
      </div>

      <div className="grid-dashboard" style={{ flex: 1, minHeight: 0 }}>
        
        {/* Left Column: Task Details */}
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', overflowY: 'auto', paddingRight: '4px' }}>
          
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-24)' }}>
              <div>
                <h2 className="section-title">Task Details</h2>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <span className="chip" style={{ backgroundColor: 'var(--surface-variant)', border: `1px solid ${getStatusColor(task.status)}`, color: getStatusColor(task.status) }}>
                    Status: {task.status.replace('_', ' ')}
                  </span>
                  <span className="chip" style={{ backgroundColor: 'var(--surface-variant)', border: `1px solid ${getPriorityColor(task.priority)}`, color: getPriorityColor(task.priority) }}>
                    Priority: {task.priority}
                  </span>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Created by</div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{task.creator.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  {new Date(task.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-24)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Description
              </h3>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--on-surface)', 
                lineHeight: 1.6, 
                backgroundColor: 'var(--surface-variant)', 
                padding: '16px', 
                borderRadius: '8px',
                whiteSpace: 'pre-wrap'
              }}>
                {task.description || <span style={{ fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>No description provided.</span>}
              </div>
            </div>

            <div className="grid-dashboard" style={{ gap: 'var(--spacing-16)' }}>
              <div className="col-6">
                <div style={{ backgroundColor: 'var(--surface-variant)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Assignee</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {task.assignees && task.assignees.length > 0 ? (
                        task.assignees.map((assignee: any) => (
                          <div key={assignee.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--background)', padding: '4px 8px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                            {assignee.avatarUrl ? (
                              <Image src={assignee.avatarUrl} alt="Avatar" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                {assignee.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <Link href={`/profile/${assignee.id}`} style={{ fontWeight: 600, fontSize: '14px', textDecoration: 'none', color: 'var(--on-surface)' }} className="hover-underline">{assignee.name}</Link>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--on-surface-variant)', fontSize: '14px' }}>Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  {task.approver && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Approver</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{task.approver.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>({task.approver.role.replace('_', ' ')})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-6">
                <div style={{ backgroundColor: 'var(--surface-variant)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Project</div>
                    {task.project ? (
                      <Link href={`/project/${task.project.id}`} style={{ fontWeight: 600, fontSize: '14px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {task.project.title}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>General Task</span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> Due Date
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Comments Feed */}
        <div className="col-4" style={{ height: '100%', overflow: 'hidden' }}>
          <CommentFeed taskId={task.id} comments={task.comments} currentUser={user} />
        </div>

      </div>
    </div>
  )
}
