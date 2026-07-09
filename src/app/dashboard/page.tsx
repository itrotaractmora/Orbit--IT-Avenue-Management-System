import { getSessionUser } from '@/actions/authActions'
import { prisma } from '@/utils/prisma'
import { getUsers, getTeams, onboardUser, createTeam } from '@/actions/userActions'
import { getProjects, createProject, updateProjectStatus } from '@/actions/projectActions'
import { getTasks, createTask, claimTask, submitTask, decideApproval, dropClaim, reassignTask, escalateStalledTasks } from '@/actions/taskActions'
import { UserRole, TaskStatus, ProjectStatus, UserStatus, ApprovalDecision } from '@prisma/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  CheckCircle2,
  AlertCircle,
  Users,
  FileText,
  UserPlus,
  FolderPlus,
  Plus,
  FolderOpen,
  Bell,
  Clock,
  Settings,
  ArrowRight,
  TrendingDown,
  X,
  PlayCircle,
  HelpCircle,
  XCircle,
  Circle,
  AlertTriangle,
  Info
} from 'lucide-react'

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case TaskStatus.COMPLETED:
      return (
        <span className="chip chip-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} />
          <span>Completed</span>
        </span>
      )
    case TaskStatus.PENDING_APPROVAL:
      return (
        <span className="chip chip-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          <span>Pending Approval</span>
        </span>
      )
    case TaskStatus.IN_PROGRESS:
      return (
        <span className="chip chip-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <PlayCircle size={12} />
          <span>In Progress</span>
        </span>
      )
    case TaskStatus.REJECTED:
      return (
        <span className="chip chip-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <XCircle size={12} />
          <span>Rejected</span>
        </span>
      )
    case TaskStatus.OPEN:
    default:
      return (
        <span className="chip chip-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Circle size={12} />
          <span>Open</span>
        </span>
      )
  }
}

function NotificationItem({ n }: { n: any }) {
  let icon = <Info size={16} />
  let badgeColor = 'var(--info-bg)'
  let textColor = 'var(--info)'
  let label = n.type.replace(/_/g, ' ')

  if (n.type === 'TASK_ASSIGNED') {
    icon = <FileText size={16} />
    badgeColor = 'var(--info-bg)'
    textColor = 'var(--info)'
  } else if (n.type === 'APPROVAL_NEEDED') {
    icon = <Clock size={16} />
    badgeColor = 'var(--warning-bg)'
    textColor = 'var(--warning)'
  } else if (n.type === 'TASK_REJECTED') {
    icon = <XCircle size={16} />
    badgeColor = 'var(--danger-bg)'
    textColor = 'var(--danger)'
  } else if (n.type === 'TASK_OVERDUE') {
    icon = <AlertTriangle size={16} />
    badgeColor = 'var(--danger-bg)'
    textColor = 'var(--danger)'
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px 24px',
      borderBottom: '1px solid var(--border)',
      fontSize: '14px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        backgroundColor: badgeColor,
        color: textColor,
        flexShrink: 0,
        marginTop: '2px'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: textColor
          }}>
            {label}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p style={{ color: 'var(--on-surface)', marginTop: '4px', lineHeight: '1.4' }}>
          {n.type === 'TASK_ASSIGNED' && `You have been assigned to task "${n.task?.title || 'Untitled'}"`}
          {n.type === 'APPROVAL_NEEDED' && `Task "${n.task?.title || 'Untitled'}" is pending your approval review.`}
          {n.type === 'TASK_REJECTED' && `Your task "${n.task?.title || 'Untitled'}" was rejected.`}
          {n.type === 'TASK_OVERDUE' && `Task "${n.task?.title || 'Untitled'}" is overdue!`}
        </p>
      </div>
      <form action={async () => {
        'use server'
        await prisma.notification.update({
          where: { id: n.id },
          data: { read: true }
        })
      }}>
        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }} type="submit">
          Dismiss
        </button>
      </form>
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ action?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await getSessionUser()
  if (!user) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const { action } = await searchParams

  const isAdmin = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(user.role)
  const isTeamLead = user.role === UserRole.TEAM_LEAD
  const isMember = user.role === UserRole.MEMBER

  // Fetch all necessary data
  const users = await getUsers()
  const teams = await getTeams()
  const projects = await getProjects()
  const tasks = await getTasks()

  // Notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, read: false },
    include: { task: true },
    orderBy: { createdAt: 'desc' }
  })

  // Audit Logs (Admins only)
  const auditLogs = isAdmin
    ? await prisma.auditLog.findMany({
        take: 8,
        orderBy: { timestamp: 'desc' }
      })
    : []

  // Metric Computations
  const totalProjects = projects.length
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const now = new Date()
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.COMPLETED).length

  // Filter Tasks for specific views
  const myTasks = tasks.filter(t => t.assignedToId === user.id)
  
  // Pending approvals for this user specifically
  const myPendingApprovals = tasks.filter(t => t.status === TaskStatus.PENDING_APPROVAL && (t.approverId === user.id || user.role === UserRole.PRESIDENT))

  // Claimable tasks: OPEN status, and if project is assigned to team, team matches user's team
  const claimableTasks = tasks.filter(t => {
    if (t.status !== TaskStatus.OPEN) return false
    if (t.assignedToId) return false
    if (t.project && t.project.teamId) {
      return t.project.teamId === user.teamId
    }
    return true
  })

  // Onboard Action wrapper
  async function handleOnboard(formData: FormData) {
    'use server'
    await onboardUser(null, formData)
    redirect('/dashboard')
  }

  // Create Team Action wrapper
  async function handleCreateTeam(formData: FormData) {
    'use server'
    await createTeam(null, formData)
    redirect('/dashboard')
  }

  // Create Project Action wrapper
  async function handleCreateProject(formData: FormData) {
    'use server'
    await createProject(null, formData)
    redirect('/dashboard')
  }

  // Create Task Action wrapper
  async function handleCreateTask(formData: FormData) {
    'use server'
    await createTask(null, formData)
    redirect('/dashboard')
  }

  // Run Escalations wrapper
  async function handleEscalations() {
    'use server'
    await escalateStalledTasks()
  }

  // Helper to generate initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
      
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--spacing-16)' }}>
        <div className="page-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
            <h1>Dashboard</h1>
            <span className="chip" style={{
              backgroundColor: 'rgba(83, 0, 183, 0.08)',
              color: 'var(--primary)',
              fontSize: '12px',
              padding: '4px 10px',
              fontWeight: 600,
              borderRadius: '8px'
            }}>
              {isAdmin ? "Division-wide Oversight" : isTeamLead ? `Team Oversight (${user.team?.name || 'No Team'})` : `Personal Board (${user.team?.name || 'No Team'})`}
            </span>
          </div>
          <p className="body-text" style={{ marginTop: '4px' }}>Welcome back, {user.name}. Here is your task oversight for today.</p>
        </div>
        
        {isAdmin && (
          <form action={handleEscalations}>
            <button className="btn btn-secondary" style={{ display: 'flex', gap: 'var(--spacing-8)', height: '40px' }} type="submit">
              <Clock size={16} />
              <span>Run Escalations</span>
            </button>
          </form>
        )}
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)', backgroundColor: '#fafafa' }}>
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Alert Notifications ({notifications.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(n => (
              <NotificationItem key={n.id} n={n} />
            ))}
          </div>
        </div>
      )}

      {/* Admin metrics grid */}
      {isAdmin && (
        <div className="grid-dashboard">
          <div className="card col-3 stat-card">
            <div className="stat-label">Completion Rate</div>
            <div className="stat-value">{completionRate}%</div>
            <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
              <span>{completedTasks} of {totalTasks} finished</span>
            </div>
          </div>
          
          <div className="card col-3 stat-card">
            <div className="stat-label">Overdue Tasks</div>
            <div className="stat-value" style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {overdueTasks}
            </div>
            <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--success)' }} />
              <span>Awaiting resolution</span>
            </div>
          </div>

          <div className="card col-3 stat-card">
            <div className="stat-label">Total Teams</div>
            <div className="stat-value">{teams.length}</div>
            <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} />
              <span>Active department units</span>
            </div>
          </div>

          <div className="card col-3 stat-card">
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value" style={{ color: myPendingApprovals.length > 0 ? 'var(--warning)' : 'var(--on-surface-variant)' }}>
              {myPendingApprovals.length}
            </div>
            <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={12} style={{ color: myPendingApprovals.length > 0 ? 'var(--warning)' : 'var(--on-surface-variant)' }} />
              <span>Awaiting reviews</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid content */}
      <div className="grid-dashboard">
        
        {/* LEFT COLUMN: Approvals & Tasks Lists */}
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
          
          {/* Pending Approvals Widget */}
          {myPendingApprovals.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
              <h2 className="section-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
                <FileText size={20} />
                <span>Approvals Pipeline</span>
              </h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Assignee</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPendingApprovals.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{t.title}</div>
                          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{t.description}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#e6e6e6',
                              fontSize: '10px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--on-surface-variant)'
                            }}>
                              {t.assignee ? getInitials(t.assignee.name) : 'U'}
                            </div>
                            <span>{t.assignee?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="body-text">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}</td>
                        <td>
                          {t.assignedToId === user.id ? (
                            <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              Awaiting peer approval
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <form action={async () => {
                                'use server'
                                await decideApproval(t.id, ApprovalDecision.APPROVED)
                              }}>
                                <button className="btn btn-primary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                                  Approve
                                </button>
                              </form>
                              
                              <form action={async (formData: FormData) => {
                                'use server'
                                const comment = formData.get('comment') as string
                                await decideApproval(t.id, ApprovalDecision.REJECTED, comment)
                              }} style={{ display: 'flex', gap: '4px' }}>
                                <input
                                  className="form-input"
                                  name="comment"
                                  placeholder="Rejection reason..."
                                  required
                                  style={{ height: '32px', padding: '4px 8px', fontSize: '12px', width: '130px' }}
                                />
                                <button className="btn btn-danger" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                                  Reject
                                </button>
                              </form>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Claimable Open Tasks (Members / Team Leads) */}
          {claimableTasks.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
                <Users size={20} />
                <span>Open Tasks Queue</span>
              </h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Project</th>
                      <th>Priority</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimableTasks.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{t.title}</div>
                          <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{t.description}</div>
                        </td>
                        <td className="body-text">{t.project ? t.project.title : 'General Task'}</td>
                        <td>
                          <span className={`chip chip-${
                            t.priority === 'URGENT' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'info'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <form action={async () => {
                            'use server'
                            await claimTask(t.id)
                          }}>
                            <button className="btn btn-secondary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                              Claim
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* My Assigned Tasks (For Members & Team Leads) */}
          {!isAdmin && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
              <h2 className="section-title">Active Task Board</h2>
              {myTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="empty-state-title">No assigned tasks</div>
                  <div className="empty-state-description">Your queue is currently clear. Claim an open task from the system queue.</div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTasks.map(t => {
                        const latestRejection = t.approvals?.find(a => a.decision === 'REJECTED')
                        const rejectionComment = latestRejection?.comment
                        return (
                          <tr key={t.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{t.title}</div>
                              {t.dueDate && (
                                <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                                  Due: {new Date(t.dueDate).toLocaleDateString()}
                                </div>
                              )}
                              {t.status === TaskStatus.REJECTED && rejectionComment && (
                                <div style={{
                                  fontSize: '12px',
                                  color: 'var(--danger)',
                                  backgroundColor: 'var(--danger-bg)',
                                  border: '1px solid rgba(239, 68, 68, 0.1)',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  marginTop: '6px',
                                  display: 'inline-block'
                                }}>
                                  <strong>Rejection Comment:</strong> {rejectionComment}
                                </div>
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
                              <TaskStatusBadge status={t.status} />
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {(t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.REJECTED) && (
                                  <form action={async () => {
                                    'use server'
                                    await submitTask(t.id)
                                  }}>
                                    <button className="btn btn-primary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                                      Submit
                                    </button>
                                  </form>
                                )}
                                
                                {(t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.OPEN) && (
                                  <form action={async (formData: FormData) => {
                                    'use server'
                                    const reason = formData.get('reason') as string
                                    await dropClaim(t.id, reason)
                                  }} style={{ display: 'flex', gap: '4px' }}>
                                    <input
                                      className="form-input"
                                      name="reason"
                                      placeholder="Drop reason..."
                                      required
                                      style={{ height: '32px', padding: '4px 8px', fontSize: '12px', width: '120px' }}
                                    />
                                    <button className="btn btn-secondary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                                      Drop
                                    </button>
                                  </form>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Division Wide Tasks List (For Admin oversight) */}
          {isAdmin && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
              <h2 className="section-title">Tasks Oversight</h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Assignee</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Reassign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => {
                      const latestRejection = t.approvals?.find(a => a.decision === 'REJECTED')
                      const rejectionComment = latestRejection?.comment
                      return (
                        <tr key={t.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{t.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px' }}>Priority: {t.priority}</div>
                            {t.status === TaskStatus.REJECTED && rejectionComment && (
                              <div style={{
                                fontSize: '11px',
                                color: 'var(--danger)',
                                backgroundColor: 'var(--danger-bg)',
                                border: '1px solid rgba(239, 68, 68, 0.1)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                marginTop: '4px',
                                display: 'inline-block'
                              }}>
                                <strong>Reason:</strong> {rejectionComment}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#f1eef8',
                                color: 'var(--primary)',
                                fontSize: '10px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {t.assignee ? getInitials(t.assignee.name) : 'U'}
                              </div>
                              <span>{t.assignee?.name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="body-text">{t.project?.title || 'General Task'}</td>
                          <td>
                            <TaskStatusBadge status={t.status} />
                          </td>
                        <td>
                          <form action={async (formData: FormData) => {
                            'use server'
                            const targetUserId = formData.get('assigneeId') as string
                            if (targetUserId) {
                              await reassignTask(t.id, targetUserId)
                            }
                          }} style={{ display: 'flex', gap: '4px' }}>
                            <select className="form-select" name="assigneeId" style={{ height: '32px', padding: '4px', fontSize: '12px', width: '130px' }}>
                              <option value="">Select user...</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                            <button className="btn btn-secondary" style={{ height: '32px', padding: '0 8px', fontSize: '12px', borderRadius: '8px' }} type="submit">
                              Assign
                            </button>
                          </form>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Quick Actions, Project Overview, Audit Log */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
          
          {/* Quick Actions Panel */}
          {isAdmin && (
            <div className="card" style={{ border: '1px solid rgba(83, 0, 183, 0.12)' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
                <Settings size={18} style={{ color: 'var(--primary)' }} />
                <span>Quick Actions</span>
              </h3>
              <div className="quick-actions-grid">
                <Link href="/dashboard?action=new-employee" className="quick-action-btn">
                  <UserPlus size={16} />
                  <span>New Employee</span>
                </Link>
                <Link href="/dashboard?action=create-team" className="quick-action-btn">
                  <Users size={16} />
                  <span>Create Team</span>
                </Link>
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
            <div className="card" style={{ border: '1px solid rgba(83, 0, 183, 0.12)' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
                <Settings size={18} style={{ color: 'var(--primary)' }} />
                <span>Team Actions</span>
              </h3>
              <div className="quick-actions-grid" style={{ gridTemplateColumns: '1fr' }}>
                <Link href="/dashboard?action=new-task" className="quick-action-btn">
                  <Plus size={16} />
                  <span>Create Team Task</span>
                </Link>
              </div>
            </div>
          )}

          {/* Projects List Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
            <h2 className="title-md">Projects</h2>
            {projects.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--spacing-24)' }}>
                <div className="empty-state-icon" style={{ padding: 'var(--spacing-8)' }}>
                  <FolderOpen size={20} />
                </div>
                <div className="empty-state-title" style={{ fontSize: '14px' }}>No active projects</div>
                <div className="empty-state-description" style={{ fontSize: '12px' }}>Create projects to organize development tasks.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
                {projects.map(p => (
                  <div key={p.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--spacing-12)' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>{p.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{p.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-8)' }}>
                      <span className={`chip chip-${
                        p.status === ProjectStatus.ACTIVE ? 'success' : p.status === ProjectStatus.COMPLETED ? 'info' : 'neutral'
                      }`} style={{ fontSize: '10px' }}>
                        {p.status}
                      </span>
                      {isAdmin && p.status === ProjectStatus.ACTIVE && (
                        <form action={async () => {
                          'use server'
                          await updateProjectStatus(p.id, ProjectStatus.COMPLETED)
                        }}>
                          <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }} type="submit">
                            Complete
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Logs Trail (Admins only) */}
          {isAdmin && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
              <h2 className="title-md">System Log</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
                {auditLogs.map(l => (
                  <div key={l.id} style={{ fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{l.action}</span>
                      <span style={{ fontSize: '11px', color: 'var(--outline)' }}>{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: 'var(--on-surface-variant)', marginTop: '2px', fontSize: '12px' }}>
                      {l.entityType} ID: {l.entityId.substring(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* =====================================================
          INTERACTIVE MODAL OVERLAYS (triggered via searchParams)
          ===================================================== */}

      {/* 1. Onboard User Modal */}
      {action === 'new-employee' && isAdmin && (
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
                  {user.role === UserRole.PRESIDENT && (
                    <>
                      <option value="SENIOR_DIRECTOR">Senior Director</option>
                      <option value="CO_DIRECTOR">Co-Director</option>
                    </>
                  )}
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="MEMBER">Team Member</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="teamId">Assigned Team</label>
                <select className="form-select" id="teamId" name="teamId">
                  <option value="">No Team Assigned</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
                <Link href="/dashboard" className="btn btn-secondary">Cancel</Link>
                <button className="btn btn-primary" type="submit">Onboard Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create Team Modal */}
      {action === 'create-team' && isAdmin && (
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
      )}

      {/* 3. Create Project Modal */}
      {action === 'create-project' && isAdmin && (
        <div className="glass-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
              <h3 className="card-title">Create New Project</h3>
              <Link href="/dashboard" style={{ color: 'var(--on-surface-variant)' }}>
                <X size={18} />
              </Link>
            </div>
            
            <form action={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
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
                <button className="btn btn-primary" type="submit">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Task Modal */}
      {action === 'new-task' && (isAdmin || isTeamLead) && (
        <div className="glass-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
              <h3 className="card-title">Create New Task</h3>
              <Link href="/dashboard" style={{ color: 'var(--on-surface-variant)' }}>
                <X size={18} />
              </Link>
            </div>
            
            <form action={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="taskTitle">Task Title</label>
                <input className="form-input" id="taskTitle" name="title" placeholder="Verify SSL certificates" required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="taskDesc">Description</label>
                <textarea className="form-textarea" id="taskDesc" name="description" placeholder="Specific guidelines..." />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="projectId">Project Scope</label>
                <select className="form-select" id="projectId" name="projectId">
                  <option value="">Standalone Task (No Project)</option>
                  {isTeamLead 
                    ? projects.filter(p => p.teamId === user.teamId).map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))
                    : projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="assignedToId">Assignee</label>
                <select className="form-select" id="assignedToId" name="assignedToId">
                  <option value="">Leave Unassigned (Open to Claim)</option>
                  {isTeamLead
                    ? users.filter(u => u.teamId === user.teamId).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))
                    : users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role.toLowerCase()})</option>
                      ))
                  }
                </select>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-12)' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="priority">Priority</label>
                  <select className="form-select" id="priority" name="priority" defaultValue="MEDIUM">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="dueDate">Due Date</label>
                  <input className="form-input" id="dueDate" name="dueDate" type="date" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
                <Link href="/dashboard" className="btn btn-secondary">Cancel</Link>
                <button className="btn btn-primary" type="submit">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
