'use server'

import { prisma } from '@/utils/prisma'
import { getSessionUser } from './authActions'
import { revalidatePath } from 'next/cache'
import { TaskStatus, UserRole } from '@prisma/client'

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const actor = await getSessionUser()
  if (!actor) return { error: 'Not authenticated' }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true, assignees: true }
    })

    if (!task) return { error: 'Task not found' }

    // Check authorization:
    // Can move task if:
    // 1. You are Admin Tier
    // 2. You are the Creator of the task
    // 3. You are the Assignee of the task
    // 4. You are a Team Lead of the Team that owns the Project
    const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
    const isCreator = task.createdById === actor.id
    const isAssignee = task.assignees.some(u => u.id === actor.id)
    const isTeamLeadOfProject = actor.role === UserRole.TEAM_LEAD && task.project?.teamId === actor.teamId

    if (!isAdminTier && !isCreator && !isAssignee && !isTeamLeadOfProject) {
      return { error: 'Not authorized to move this task' }
    }

    // Logic checks:
    // If moving to COMPLETED or PENDING_APPROVAL and needs approval, we might enforce some rules.
    // For Kanban simplicity, we will just update the status. 
    // Wait, if it needs approval, maybe we shouldn't allow moving directly to COMPLETED unless admin.
    if (newStatus === TaskStatus.COMPLETED && !isAdminTier && task.approverId) {
       // If there's an approver, members should move to PENDING_APPROVAL
       if (task.approverId !== actor.id) {
         return { error: 'Task must be approved by the designated approver.' }
       }
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus }
    })

    // Audit log for Kanban status changes
    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: `STATUS_${newStatus}`,
        actorId: actor.id
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to update task status:', error)
    return { error: 'Failed to update task status' }
  }
}

export async function quickCreateTask(title: string) {
  const actor = await getSessionUser()
  if (!actor) return { error: 'Not authenticated' }

  // Only admins, co-directors, and team leads can create tasks
  const canCreate = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR, UserRole.TEAM_LEAD] as UserRole[]).includes(actor.role)
  if (!canCreate) {
    return { error: 'You do not have permission to create tasks.' }
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        status: TaskStatus.OPEN,
        priority: 'MEDIUM',
        createdById: actor.id,
        assignees: { connect: { id: actor.id } },
      }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: task.id,
        action: 'CREATED',
        actorId: actor.id
      }
    })

    revalidatePath('/dashboard')
    return { success: true, task }
  } catch (err: any) {
    return { error: err.message }
  }
}
