import { getSessionUser } from '@/actions/authActions'
import { prisma } from '@/utils/prisma'
import { getUsers, getTeams } from '@/actions/userActions'
import { getProjects } from '@/actions/projectActions'
import { getTasks, escalateStalledTasks } from '@/actions/taskActions'
import { UserRole, TaskStatus } from '@prisma/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { KanbanBoard } from './_components/KanbanBoard'
import { Plus, Search, Filter, KanbanSquare, Clock } from 'lucide-react'

// Components
import { StatsGrid } from './_components/StatsGrid'
import { NotificationsPanel } from './_components/NotificationsPanel'
import { ApprovalsTable } from './_components/ApprovalsTable'
import { ClaimableTasksQueue } from './_components/ClaimableTasksQueue'
import { MyTasksBoard } from './_components/MyTasksBoard'
import { TasksOversightTable } from './_components/TasksOversightTable'
import { ProjectsList } from './_components/ProjectsList'
import { AuditLogPanel } from './_components/AuditLogPanel'
import { QuickActions } from './_components/QuickActions'

// Modals
import { OnboardModal } from './_components/modals/OnboardModal'
import { ProjectJoinRequestsTable } from './_components/ProjectJoinRequestsTable'
import { JoinRequestStatus } from '@prisma/client'
import { CreateTeamModal } from './_components/modals/CreateTeamModal'
import { CreateProjectModal } from './_components/modals/CreateProjectModal'
import { CreateTaskModal } from './_components/modals/CreateTaskModal'
import { EditTaskModal } from './_components/modals/EditTaskModal'
import { CompleteTaskModal } from './_components/modals/CompleteTaskModal'

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

  const isExecutive = user.role === UserRole.PRESIDENT || user.role === UserRole.SENIOR_DIRECTOR
  const isCoDirector = user.role === UserRole.CO_DIRECTOR
  const isTeamLead = user.role === UserRole.TEAM_LEAD
  const isMember = user.role === UserRole.MEMBER

  const isAdminTier = isExecutive || isCoDirector // Used for some basic UI logic

  // Fetch all necessary data in parallel
  const [allUsers, allTeams, allProjects, allTasks, notifications, auditLogs, pendingJoinRequests] = await Promise.all([
    getUsers(),
    getTeams(),
    getProjects(),
    getTasks(),
    prisma.notification.findMany({
      where: { userId: user.id, read: false },
      include: { task: true },
      orderBy: { createdAt: 'desc' }
    }),
    isExecutive ? prisma.auditLog.findMany({ take: 5, orderBy: { timestamp: 'desc' } }) : Promise.resolve([]),
    isAdminTier ? prisma.joinRequest.findMany({ where: { status: JoinRequestStatus.PENDING }, include: { user: true, project: true }, orderBy: { createdAt: 'desc' } }) : Promise.resolve([])
  ])

  // Filter data based on Role Hierarchy
  let visibleTeams = allTeams
  let visibleProjects = allProjects
  let visibleTasks = allTasks

  if (isTeamLead || isMember) {
    visibleTeams = allTeams.filter(t => t.id === user.teamId)
    // Team Lead / Member sees their own tasks, their team's tasks, AND any OPEN task division-wide
    visibleTasks = allTasks.filter(t => 
      t.status === TaskStatus.OPEN || 
      t.assignees.some((a: any) => a.id === user.id) || 
      t.project?.members.some((m: any) => m.id === user.id) ||
      t.createdById === user.id
    )
  }

  // Metric Computations (Based on visible tasks)
  const completedTasks = visibleTasks.filter(t => t.status === TaskStatus.COMPLETED).length
  const completionRate = visibleTasks.length > 0 ? Math.round((completedTasks / visibleTasks.length) * 100) : 0
  const overdueTasks = visibleTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.COMPLETED).length

  // Filter Tasks for specific views
  const myTasks = allTasks.filter(t => t.assignees.some((a: any) => a.id === user.id))
  
  // Pending approvals for this user specifically
  const myPendingApprovals = allTasks.filter(t => t.status === TaskStatus.PENDING_APPROVAL && (t.approverId === user.id || user.role === UserRole.PRESIDENT))

  // Claimable tasks (Open tasks within the visible scope that aren't assigned)
  const claimableTasks = visibleTasks.filter(t => {
    if (t.status !== TaskStatus.OPEN) return false
    if (t.assignees && t.assignees.length > 0) return false
    return true
  })

  async function handleEscalations() {
    'use server'
    await escalateStalledTasks()
  }

  let dashboardTitle = "Division-wide Oversight"
  if (isCoDirector) dashboardTitle = "Overseer Dashboard"
  if (isTeamLead) dashboardTitle = `Team Oversight (${user.team?.name || 'No Team'})`
  if (isMember) dashboardTitle = `Personal Board (${user.team?.name || 'No Team'})`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
      
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--spacing-16)' }}>
        <div className="page-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
            <h1>Dashboard</h1>
            <span className="chip" style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '12px',
              padding: '4px 10px',
              fontWeight: 600,
              borderRadius: '8px'
            }}>
              {dashboardTitle}
            </span>
          </div>
          <p className="body-text" style={{ marginTop: '4px' }}>Welcome back, {user.name}. Here is your task oversight for today.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'center' }}>
          <Link href="/members" className="btn btn-secondary" style={{ height: '36px', fontSize: '13px' }}>
            All Members
          </Link>
          <Link href="/projects" className="btn btn-secondary" style={{ height: '36px', fontSize: '13px' }}>
            All Projects
          </Link>
          {isExecutive && (
            <form action={handleEscalations}>
              <button className="btn btn-secondary" style={{ display: 'flex', gap: 'var(--spacing-8)', height: '36px', fontSize: '13px' }} type="submit">
                <Clock size={16} />
                <span>Run Escalations</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <NotificationsPanel notifications={notifications} />

      {(isExecutive || isCoDirector) && (
        <StatsGrid 
          completionRate={completionRate}
          completedTasks={completedTasks}
          totalTasks={visibleTasks.length}
          overdueTasks={overdueTasks}
          teamsCount={visibleTeams.length}
          pendingApprovalsCount={myPendingApprovals.length}
        />
      )}

      {/* Main Grid content */}
      <div className="grid-dashboard">
        
        {/* LEFT COLUMN: Approvals & Tasks Lists */}
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
          {isAdminTier && <ProjectJoinRequestsTable requests={pendingJoinRequests} />}
          <ApprovalsTable approvals={myPendingApprovals} userId={user.id} />
          <ClaimableTasksQueue tasks={claimableTasks} />
          
          {(isTeamLead || isMember) && <MyTasksBoard myTasks={myTasks} />}
          
          {(isExecutive || isCoDirector) && (
            <>
              <TasksOversightTable 
                tasks={visibleTasks.filter(t => t.status === 'IN_PROGRESS')} 
                users={allUsers} 
                title="Current Ongoing Tasks" 
                defaultStatus="IN_PROGRESS" 
              />
              <TasksOversightTable 
                tasks={visibleTasks} 
                users={allUsers} 
                title="All Tasks Oversight"
              />
            </>
          )}
          
          {isTeamLead && (
            <>
              <TasksOversightTable 
                tasks={visibleTasks.filter(t => !t.assignees.some((a: any) => a.id === user.id) && t.status === 'IN_PROGRESS')} 
                users={allUsers.filter(u => u.teamId === user.teamId)} 
                title="Team Ongoing Tasks"
                defaultStatus="IN_PROGRESS"
              />
              <TasksOversightTable 
                tasks={visibleTasks.filter(t => !t.assignees.some((a: any) => a.id === user.id))} 
                users={allUsers.filter(u => u.teamId === user.teamId)} 
                title="Team Tasks Oversight"
              />
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Quick Actions, Project Overview, Audit Log */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
          {!isMember && <QuickActions isExecutive={isExecutive} isCoDirector={isCoDirector} isTeamLead={isTeamLead} />}
          <ProjectsList projects={visibleProjects} isAdmin={isAdminTier} />
          {isExecutive && <AuditLogPanel auditLogs={auditLogs} isAdmin={isExecutive} />}
        </div>
      </div>

      {/* KANBAN BOARD SECTION */}
      <div className="card" style={{ marginTop: 'var(--spacing-16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <KanbanSquare size={20} color="var(--primary)" />
            Interactive Task Board
          </h2>
        </div>
        <div style={{ height: '600px' }}>
          <KanbanBoard initialTasks={visibleTasks} currentUser={user} />
        </div>
      </div>

      {/* Modals */}
      <OnboardModal action={action} isExecutive={isExecutive} isCoDirector={isCoDirector} isTeamLead={isTeamLead} userRole={user.role} userTeamId={user.teamId} teams={visibleTeams} />
      <CreateTeamModal action={action} isExecutive={isExecutive} users={allUsers} />
      <CreateProjectModal action={action} isAdminTier={isAdminTier} teams={visibleTeams} />
      <CreateTaskModal action={action} isAdminTier={isAdminTier} isTeamLead={isTeamLead} userTeamId={user.teamId} projects={visibleProjects} users={allUsers} />
      
      {action?.startsWith('edit-task-') && (
        <EditTaskModal 
          action={action} 
          task={allTasks.find(t => t.id === action.replace('edit-task-', ''))} 
          projects={visibleProjects} 
          users={allUsers} 
        />
      )}
      
      {action?.startsWith('complete-task-') && (
        <CompleteTaskModal 
          action={action} 
          task={allTasks.find(t => t.id === action.replace('complete-task-', ''))} 
        />
      )}
    </div>
  )
}
