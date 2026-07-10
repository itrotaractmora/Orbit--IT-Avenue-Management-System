'use server'

import { prisma } from '@/utils/prisma'
import { getSessionUser } from './authActions'
import { UserRole, TaskStatus, TaskPriority, UserStatus, ApprovalDecision } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Helper: Resolve approver for a task assignee to prevent self-approval
async function resolveApproverId(assigneeId: string, assigneeRole: UserRole, assigneeTeamId: string | null): Promise<string> {
  // 1. If assignee is a Member or Team Lead, default to the Co-Director of their team
  if (assigneeRole === UserRole.MEMBER || assigneeRole === UserRole.TEAM_LEAD) {
    if (assigneeTeamId) {
      const team = await prisma.team.findUnique({
        where: { id: assigneeTeamId },
        select: { coDirectorId: true }
      })
      if (team?.coDirectorId && team.coDirectorId !== assigneeId) {
        return team.coDirectorId
      }
    }
    // Fallback: any active Co-Director that is not the assignee
    const fallbackCoDir = await prisma.user.findFirst({
      where: { role: UserRole.CO_DIRECTOR, id: { not: assigneeId }, status: UserStatus.ACTIVE }
    })
    if (fallbackCoDir) return fallbackCoDir.id
  }

  // 2. If Co-Director, escalate to Senior Director
  const seniorDir = await prisma.user.findFirst({
    where: { role: UserRole.SENIOR_DIRECTOR, id: { not: assigneeId }, status: UserStatus.ACTIVE }
  })
  if (seniorDir) return seniorDir.id

  // 3. If Senior Director or Co-Director (fallback), escalate to President
  const president = await prisma.user.findFirst({
    where: { role: UserRole.PRESIDENT, id: { not: assigneeId }, status: UserStatus.ACTIVE }
  })
  if (president) return president.id

  // 4. Safest fallback: any admin who is not the assignee
  const fallbackAdmin = await prisma.user.findFirst({
    where: {
      role: { in: [UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] },
      id: { not: assigneeId },
      status: UserStatus.ACTIVE
    }
  })
  if (fallbackAdmin) return fallbackAdmin.id

  throw new Error('No eligible approver could be resolved to avoid self-approval.')
}

export async function createTask(prevState: any, formData: FormData) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  // Permitted to create tasks: Senior Director, Co-Director, Team Lead (scoped to team)
  const canCreate = ([UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR, UserRole.TEAM_LEAD] as UserRole[]).includes(actor.role)
  if (!canCreate) {
    return { error: 'Unauthorized. You do not have permission to create tasks.' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string || ''
  const projectId = formData.get('projectId') as string || null
  const assignedToId = formData.get('assignedToId') as string || null
  const priority = formData.get('priority') as TaskPriority || TaskPriority.MEDIUM
  const dueDateStr = formData.get('dueDate') as string

  if (!title) {
    return { error: 'Task title is required' }
  }

  const dueDate = dueDateStr ? new Date(dueDateStr) : null

  // Enforcement: Team Leads can only create tasks scoped to their own team or projects in their team
  if (actor.role === UserRole.TEAM_LEAD) {
    if (!actor.teamId) {
      return { error: 'Team Leads must be assigned to a team to create tasks.' }
    }
    // If a project is selected, verify it matches the team
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (project?.teamId !== actor.teamId) {
        return { error: 'Team Leads can only create tasks for projects overseen by their team.' }
      }
    }
    // If assignee is set, verify they are in the same team
    if (assignedToId) {
      const targetUser = await prisma.user.findUnique({ where: { id: assignedToId } })
      if (targetUser?.teamId !== actor.teamId) {
        return { error: 'Team Leads can only assign tasks to their own team members.' }
      }
    }
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: projectId || undefined,
        createdById: actor.id,
        assignedToId: assignedToId || undefined,
        priority,
        status: TaskStatus.OPEN,
        dueDate
      }
    })

    // Log to audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: task.id,
        action: 'CREATED',
        actorId: actor.id
      }
    })

    // Notify assignee if pre-assigned
    if (assignedToId) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          type: 'TASK_ASSIGNED',
          taskId: task.id
        }
      })
    }

    revalidatePath('/dashboard')
    return { success: 'Task created successfully!' }
  } catch (error: any) {
    return { error: `Failed to create task: ${error.message}` }
  }
}

export async function claimTask(taskId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  // Presidents, Senior Directors, Co-Directors, Team Leads, and Members can claim tasks.
  // Verify task status is OPEN.
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  })

  if (!task || task.status !== TaskStatus.OPEN) {
    return { error: 'Task is not available for claiming.' }
  }

  // Team Leads and Members can only claim tasks within their own team (if assigned to a team)
  if (([UserRole.TEAM_LEAD, UserRole.MEMBER] as UserRole[]).includes(actor.role)) {
    if (task.project && task.project.teamId && task.project.teamId !== actor.teamId) {
      return { error: 'You can only claim tasks assigned to your team.' }
    }
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: actor.id,
        status: TaskStatus.IN_PROGRESS
      }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: 'CLAIMED',
        actorId: actor.id
      }
    })

    revalidatePath('/dashboard')
    return { success: 'Task claimed successfully!' }
  } catch (error: any) {
    return { error: `Failed to claim task: ${error.message}` }
  }
}

export async function submitTask(taskId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  })

  if (!task || task.assignedToId !== actor.id) {
    return { error: 'Only the assignee can submit the task for approval.' }
  }

  if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.REJECTED) {
    return { error: 'Task must be in progress or rejected to submit.' }
  }

  try {
    // Resolve approver server-side (preventing self-approval)
    const approverId = await resolveApproverId(actor.id, actor.role, actor.teamId)

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.PENDING_APPROVAL,
        approverId
      }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: 'SUBMITTED',
        actorId: actor.id
      }
    })

    // Notify Approver
    await prisma.notification.create({
      data: {
        userId: approverId,
        type: 'APPROVAL_NEEDED',
        taskId: task.id
      }
    })

    revalidatePath('/dashboard')
    return { success: 'Task submitted for approval!' }
  } catch (error: any) {
    return { error: `Failed to submit task: ${error.message}` }
  }
}

export async function decideApproval(taskId: string, decision: ApprovalDecision, comment?: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId }
  })

  if (!task || task.status !== TaskStatus.PENDING_APPROVAL) {
    return { error: 'Task is not awaiting approval.' }
  }

  // Ensure actor matches the resolved approverId, or actor is President/Senior Director override
  const isApprover = task.approverId === actor.id
  const isSuperUser = actor.role === UserRole.PRESIDENT
  const isSeniorOverride = actor.role === UserRole.SENIOR_DIRECTOR

  if (!isApprover && !isSuperUser && !isSeniorOverride) {
    return { error: 'Unauthorized. You are not the assigned approver for this task.' }
  }

  // Self-approval check
  if (task.assignedToId === actor.id) {
    return { error: 'Security constraint: You cannot approve your own task.' }
  }

  // Mandatory comment check for rejections
  if (decision === ApprovalDecision.REJECTED && (!comment || comment.trim() === '')) {
    return { error: 'A rejection comment is required.' }
  }

  try {
    const finalStatus = decision === ApprovalDecision.APPROVED ? TaskStatus.COMPLETED : TaskStatus.REJECTED

    await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { status: finalStatus }
      }),
      prisma.approval.create({
        data: {
          taskId,
          decidedById: actor.id,
          decision,
          comment
        }
      }),
      prisma.auditLog.create({
        data: {
          entityType: 'Task',
          entityId: taskId,
          action: decision === ApprovalDecision.APPROVED ? 'APPROVED' : 'REJECTED',
          actorId: actor.id
        }
      })
    ])

    // Notify Assignee
    if (task.assignedToId) {
      await prisma.notification.create({
        data: {
          userId: task.assignedToId,
          type: decision === ApprovalDecision.APPROVED ? 'TASK_ASSIGNED' : 'TASK_REJECTED', // Using task_assigned as general success notifications, or customized. Let's make it task_rejected for rejections.
          taskId: task.id
        }
      })
    }

    revalidatePath('/dashboard')
    return { success: `Task has been successfully ${decision.toLowerCase()}!` }
  } catch (error: any) {
    return { error: `Failed to record decision: ${error.message}` }
  }
}

export async function dropClaim(taskId: string, reason: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  if (!reason || reason.trim() === '') {
    return { error: 'A drop reason is required.' }
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  })

  if (!task || task.assignedToId !== actor.id) {
    return { error: 'Only the assignee can drop a claimed task.' }
  }

  if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.OPEN) {
    return { error: 'Cannot drop task at this lifecycle stage.' }
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: null,
        status: TaskStatus.OPEN
      }
    })

    // Log the drop event
    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: 'REASSIGNED', // Representing dropped
        actorId: actor.id
      }
    })

    // Notify the Team Lead about the orphaned task
    if (actor.teamId) {
      const team = await prisma.team.findUnique({ where: { id: actor.teamId } })
      if (team?.leadId) {
        await prisma.notification.create({
          data: {
            userId: team.leadId,
            type: 'TASK_OVERDUE', // Notify lead using overdue or general alert channel
            taskId: task.id
          }
        })
      }
    }

    revalidatePath('/dashboard')
    return { success: 'Task claim dropped.' }
  } catch (error: any) {
    return { error: `Failed to drop task: ${error.message}` }
  }
}

export async function reassignTask(taskId: string, targetUserId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  // Reassignment permitted for Team Leads (own team) and Co-Directors/Senior Directors/Presidents (any)
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  })

  if (!task) {
    return { error: 'Task not found.' }
  }

  const isTeamLeadOfTask = actor.role === UserRole.TEAM_LEAD && actor.teamId && task.project?.teamId === actor.teamId
  const isAdmin = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)

  if (!isTeamLeadOfTask && !isAdmin) {
    return { error: 'Unauthorized. You do not have permission to reassign this task.' }
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: targetUserId,
        status: TaskStatus.IN_PROGRESS
      }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: 'REASSIGNED',
        actorId: actor.id
      }
    })

    // Notify new assignee
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'TASK_ASSIGNED',
        taskId: task.id
      }
    })

    revalidatePath('/dashboard')
    return { success: 'Task reassigned successfully!' }
  } catch (error: any) {
    return { error: `Failed to reassign task: ${error.message}` }
  }
}

export async function getTasks() {
  const actor = await getSessionUser()
  if (!actor) return []

  // Admins see all tasks
  if (([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)) {
    return prisma.task.findMany({
      include: {
        project: true,
        assignee: true,
        creator: true,
        approver: true,
        approvals: { include: { decidedBy: true }, orderBy: { decidedAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Team Leads see team tasks (projects overseen by their team) or standalone tasks created by/assigned to team members
  if (actor.role === UserRole.TEAM_LEAD && actor.teamId) {
    return prisma.task.findMany({
      where: {
        OR: [
          { project: { teamId: actor.teamId } },
          { assignee: { teamId: actor.teamId } }
        ]
      },
      include: {
        project: true,
        assignee: true,
        creator: true,
        approver: true,
        approvals: { include: { decidedBy: true }, orderBy: { decidedAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Members see their assigned tasks and open claimable tasks matching their team
  if (actor.role === UserRole.MEMBER) {
    return prisma.task.findMany({
      where: {
        OR: [
          { assignedToId: actor.id },
          { status: TaskStatus.OPEN, project: { teamId: actor.teamId } },
          { status: TaskStatus.OPEN, projectId: null } // general standalone open tasks
        ]
      },
      include: {
        project: true,
        assignee: true,
        creator: true,
        approver: true,
        approvals: { include: { decidedBy: true }, orderBy: { decidedAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  return []
}

// Escalation Timeout Check: Escalates stalled pending approval tasks after 3 days
export async function escalateStalledTasks(isCron = false) {
  if (!isCron) {
    const actor = await getSessionUser()
    if (!actor || !([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)) {
      return { error: 'Unauthorized' }
    }
  }

  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  try {
    // Find tasks pending approval for more than 3 days
    const stalledTasks = await prisma.task.findMany({
      where: {
        status: TaskStatus.PENDING_APPROVAL,
        updatedAt: { lt: threeDaysAgo }
      },
      include: { approver: true }
    })

    let count = 0

    for (const task of stalledTasks) {
      if (!task.approverId) continue

      // Resolve a new approver that is one level higher than current approver
      let newApproverId = null
      const currentApproverRole = task.approver?.role

      if (currentApproverRole === UserRole.CO_DIRECTOR) {
        // Escalate to Senior Director
        const senior = await prisma.user.findFirst({ where: { role: UserRole.SENIOR_DIRECTOR, status: UserStatus.ACTIVE } })
        if (senior) newApproverId = senior.id
      } else if (currentApproverRole === UserRole.SENIOR_DIRECTOR) {
        // Escalate to President
        const pres = await prisma.user.findFirst({ where: { role: UserRole.PRESIDENT, status: UserStatus.ACTIVE } })
        if (pres) newApproverId = pres.id
      }

      if (newApproverId && newApproverId !== task.approverId) {
        await prisma.task.update({
          where: { id: task.id },
          data: { approverId: newApproverId }
        })

        // Notify new approver of escalated task
        await prisma.notification.create({
          data: {
            userId: newApproverId,
            type: 'APPROVAL_NEEDED',
            taskId: task.id
          }
        })

        count++
      }
    }

    if (count > 0) {
      revalidatePath('/dashboard')
    }

    return { success: `Escalation sweep complete. ${count} tasks escalated.` }
  } catch (error: any) {
    return { error: `Escalation check failed: ${error.message}` }
  }
}

