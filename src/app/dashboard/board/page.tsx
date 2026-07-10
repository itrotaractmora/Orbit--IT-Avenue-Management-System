import { getSessionUser } from '@/actions/authActions'
import { prisma } from '@/utils/prisma'
import { redirect } from 'next/navigation'
import { KanbanBoard } from './_components/KanbanBoard'
import { KanbanSquare } from 'lucide-react'
import { UserRole } from '@prisma/client'

export default async function KanbanBoardPage() {
  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch tasks relevant to the user for the board
  // We'll fetch tasks they created, are assigned to, or are in projects they're members of.
  // Admins might want to see all tasks, but a board with 1000 tasks is unusable.
  // For now, we will fetch tasks related to them or their team.

  let whereCondition: any = {}

  if (user.role === UserRole.MEMBER) {
    whereCondition = {
      OR: [
        { assignedToId: user.id },
        { project: { members: { some: { id: user.id } } } },
        { projectId: null } // general open tasks
      ]
    }
  } else if (user.role === UserRole.TEAM_LEAD && user.teamId) {
    whereCondition = {
      OR: [
        { assignedToId: user.id },
        { createdById: user.id },
        { project: { teamId: user.teamId } },
        { projectId: null }
      ]
    }
  } else {
    // Presidents, Directors see everything open/in-progress, maybe limited
    // We'll just fetch all for now, limiting to active projects if needed.
    // Realistically, you'd add a project filter dropdown.
  }

  const tasks = await prisma.task.findMany({
    where: whereCondition,
    include: {
      assignee: true,
      project: true
    },
    orderBy: { dueDate: 'asc' }
  })

  return (
    <div style={{ height: 'calc(100vh - var(--header-height, 0px) - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <KanbanSquare size={28} color="var(--primary)" />
          Kanban Board
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', margin: 0 }}>
          Drag and drop tasks to update their status.
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <KanbanBoard initialTasks={tasks} currentUser={user} />
      </div>
    </div>
  )
}
