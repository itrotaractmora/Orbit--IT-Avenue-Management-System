import { prisma } from '@/utils/prisma'
import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderOpen, Calendar, Briefcase, CheckCircle2, AlertCircle, Share2, User as UserIcon } from 'lucide-react'
import { TaskStatus, ProjectStatus, UserRole } from '@prisma/client'
import { CopyLinkButton } from '@/app/profile/[id]/_components/CopyLinkButton'
import { EditProjectModal } from '@/app/dashboard/_components/modals/EditProjectModal'
import { CreateTaskModal } from '@/app/dashboard/_components/modals/CreateTaskModal'
import { EditTaskModal } from '@/app/dashboard/_components/modals/EditTaskModal'
import { addProjectMemberAction, removeProjectMemberAction } from '@/actions/projectActions'
import { deleteTaskAction } from '@/actions/taskActions'
import { Pencil, UserPlus, X, Plus, Trash2 } from 'lucide-react'

export default async function ProjectProfilePage(props: { params: Promise<{ id: string }>, searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sessionUser = await getSessionUser()
  const { id } = await props.params
  const searchParams = await props.searchParams
  const action = searchParams?.action as string | undefined
  if (!sessionUser) {
    redirect('/login')
  }


  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      team: { include: { lead: true, coDirector: true, members: true } },
      tasks: {
        include: { assignee: true }
      },
      members: true, // Specific cross-functional project members
      creator: true
    }
  })
  
  const allTeams = await prisma.team.findMany({ orderBy: { name: 'asc' } })
  const allUsers = await prisma.user.findMany({ orderBy: { name: 'asc' } })
  
  const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(sessionUser.role)
  const isCreator = project?.createdById === sessionUser.id
  const canEdit = isAdminTier || isCreator

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
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)', maxWidth: '1000px', margin: '0 auto', paddingTop: 'var(--spacing-24)' }}>
      
      {/* Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ display: 'flex', gap: 'var(--spacing-8)', height: '36px', padding: '0 12px', fontSize: '14px' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canEdit && (
            <Link href={`/project/${project.id}?action=edit-project-${project.id}`} className="btn btn-secondary" style={{ height: '36px', padding: '0 12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pencil size={14} /> Edit Project
            </Link>
          )}
          <CopyLinkButton url={`http://localhost:3000/project/${project.id}`} />
        </div>
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

      {/* Project Members (Cross-functional) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-16)' }}>
          <h3 className="section-title">Directly Assigned Project Members</h3>
        </div>
        
        {(!project.members || project.members.length === 0) ? (
          <div className="empty-state" style={{ padding: 'var(--spacing-16)' }}>
            <p className="empty-state-description">No individual members are assigned to this project directly.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--spacing-12)', flexWrap: 'wrap', marginBottom: 'var(--spacing-16)' }}>
            {project.members.map((member: any) => (
              <div key={member.id} className="chip" style={{ backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', position: 'relative' }}>
                <Link href={`/profile/${member.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 500 }}>{member.name}</span>
                </Link>
                {canEdit && (
                  <form action={async () => {
                    'use server'
                    await removeProjectMemberAction(project.id, member.id)
                  }}>
                    <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} title="Remove Member">
                      <X size={14} />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
        
        {canEdit && (
          <form action={async (formData: FormData) => {
            'use server'
            const userId = formData.get('userId') as string
            if (userId) await addProjectMemberAction(project.id, userId)
          }} style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 'var(--spacing-16)' }}>
            <select name="userId" className="form-select" style={{ maxWidth: '300px' }} required>
              <option value="">Select a user to add...</option>
              {allUsers.filter(u => !project.members.some((m: any) => m.id === u.id)).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondary" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <UserPlus size={16} /> Add Member
            </button>
          </form>
        )}
      </div>

      {/* Team Members */}
      {project.team && (
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 'var(--spacing-16)' }}>Assigned Team: {project.team.name} Members</h3>
          {(!project.team.members || project.team.members.length === 0) ? (
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
      )}

      {/* Project Tasks */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-16)' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Project Task Breakdown</h3>
          {canEdit && (
            <Link href={`/project/${project.id}?action=add-task`} className="btn btn-primary" style={{ height: '32px', padding: '0 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={14} /> Add Task
            </Link>
          )}
        </div>
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
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {project.tasks.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.title}</td>
                  <td>
                    {t.assignee ? (
                      <Link href={`/profile/${t.assignedToId}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  {canEdit && (
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link href={`/project/${project.id}?action=edit-task-${t.id}`} className="btn btn-secondary" style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Pencil size={12} /> Edit
                        </Link>
                        
                        <form action={async () => {
                          'use server'
                          await deleteTaskAction(t.id)
                        }}>
                          <button className="btn btn-secondary" style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }} type="submit" title="Delete Task">
                            <Trash2 size={12} /> Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
    
    <EditProjectModal action={action} project={project} teams={allTeams} />
    
    <CreateTaskModal 
      action={action} 
      isAdminTier={isAdminTier} 
      isTeamLead={sessionUser.role === UserRole.TEAM_LEAD} 
      userTeamId={sessionUser.teamId} 
      projects={[project]} 
      users={allUsers}
      returnUrl={`/project/${project.id}`}
      defaultProjectId={project.id}
    />
    
    {project.tasks.map(t => (
      <EditTaskModal 
        key={`edit-${t.id}`}
        action={action} 
        task={t} 
        projects={[project]} 
        users={allUsers}
        returnUrl={`/project/${project.id}`}
      />
    ))}
    </>
  )
}
