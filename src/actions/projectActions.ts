'use server'

import { prisma } from '@/utils/prisma'
import { getSessionUser } from './authActions'
import { UserRole, ProjectStatus, UserStatus, JoinRequestStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createProject(prevState: any, formData: FormData) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  // Create project is restricted to President, Senior Director, and Co-Director
  const isAdmin = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  if (!isAdmin) {
    return { error: 'Unauthorized. Only admin-tier users can create projects.' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string || ''
  const teamId = formData.get('teamId') as string || null
  const startDateStr = formData.get('startDate') as string
  const dueDateStr = formData.get('dueDate') as string

  if (!title) {
    return { error: 'Project title is required' }
  }

  const startDate = startDateStr ? new Date(startDateStr) : null
  const dueDate = dueDateStr ? new Date(dueDateStr) : null

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        createdById: actor.id,
        teamId: teamId || undefined,
        status: ProjectStatus.ACTIVE,
        startDate,
        dueDate
      }
    })

    // Log to Audit Trail
    await prisma.auditLog.create({
      data: {
        entityType: 'Project',
        entityId: project.id,
        action: 'CREATED',
        actorId: actor.id
      }
    })

    revalidatePath('/dashboard')
    return { success: 'Project created successfully!' }
  } catch (error: any) {
    return { error: `Failed to create project: ${error.message}` }
  }
}

export async function getProjects() {
  const actor = await getSessionUser()
  if (!actor) return []

  // Admins see all projects
  if (([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)) {
    return prisma.project.findMany({
      include: { creator: true, team: true, tasks: true, members: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Team Lead sees projects assigned to their team or where they are a cross-functional member
  if (actor.role === UserRole.TEAM_LEAD) {
    const orConditions: any[] = [{ members: { some: { id: actor.id } } }]
    if (actor.teamId) {
      orConditions.push({ teamId: actor.teamId })
    }
    return prisma.project.findMany({
      where: { OR: orConditions },
      include: { creator: true, team: true, tasks: true, members: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Members see active projects assigned to their team or where they are a cross-functional member
  if (actor.role === UserRole.MEMBER) {
    const orConditions: any[] = [{ members: { some: { id: actor.id } } }]
    if (actor.teamId) {
      orConditions.push({ teamId: actor.teamId })
    }
    return prisma.project.findMany({
      where: {
        status: ProjectStatus.ACTIVE,
        OR: orConditions
      },
      include: { creator: true, team: true, tasks: true, members: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  return []
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const isAdmin = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  if (!isAdmin) {
    return { error: 'Unauthorized. Only admin-tier users can modify project status.' }
  }

  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { status }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Project',
        entityId: project.id,
        action: 'REASSIGNED', // custom action representing status change
        actorId: actor.id
      }
    })

    revalidatePath('/dashboard')
    return { success: 'Project status updated!' }
  } catch (error: any) {
    return { error: `Failed to update project status: ${error.message}` }
  }
}

export async function deleteProjectAction(projectId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const isAdmin = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  if (!isAdmin) {
    return { error: 'Unauthorized. Only admin-tier users can delete projects.' }
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: true }
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    if (project.tasks.length > 0) {
      const taskIds = project.tasks.map(t => t.id)
      await prisma.notification.deleteMany({ where: { taskId: { in: taskIds } } })
      await prisma.approval.deleteMany({ where: { taskId: { in: taskIds } } })
      await prisma.task.deleteMany({ where: { id: { in: taskIds } } })
    }

    await prisma.project.delete({
      where: { id: projectId }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Project',
        entityId: projectId,
        action: 'DELETED', // Reusing an action format
        actorId: actor.id
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/projects')
    return { success: 'Project deleted successfully!' }
  } catch (error: any) {
    console.error('Delete project error:', error)
    return { error: `Failed to delete project: ${error.message}` }
  }
}

export async function updateProjectAction(prevState: any, formData: FormData) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const projectId = formData.get('projectId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const teamId = formData.get('teamId') as string || null
  const startDateStr = formData.get('startDate') as string
  const dueDateStr = formData.get('dueDate') as string
  const status = formData.get('status') as ProjectStatus

  if (!projectId || !title) {
    return { error: 'Project ID and title are required' }
  }

  // Fetch existing project to check permissions
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!existingProject) {
    return { error: 'Project not found' }
  }

  const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  const isCreator = existingProject.createdById === actor.id

  if (!isAdminTier && !isCreator) {
    return { error: 'You do not have permission to edit this project.' }
  }

  try {
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title,
        description: description || null,
        teamId: teamId || null,
        status,
        startDate: startDateStr ? new Date(startDateStr) : null,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
      }
    })

    // Log to Audit Trail
    await prisma.auditLog.create({
      data: {
        entityType: 'Project',
        entityId: updatedProject.id,
        action: 'UPDATED',
        actorId: actor.id
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/projects')
    revalidatePath(`/project/${projectId}`)
    return { success: 'Project updated successfully!' }
  } catch (error: any) {
    console.error('Update project error:', error)
    return { error: `Failed to update project: ${error.message}` }
  }
}

export async function addProjectMemberAction(projectId: string, userId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const existingProject = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!existingProject) {
    return { error: 'Project not found' }
  }

  const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  const isCreator = existingProject.createdById === actor.id

  if (!isAdminTier && !isCreator) {
    return { error: 'You do not have permission to modify this project.' }
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userId }
        }
      }
    })

    revalidatePath(`/project/${projectId}`)
    revalidatePath('/dashboard')
    revalidatePath('/projects')
    return { success: 'Member added to project successfully.' }
  } catch (error: any) {
    return { error: `Failed to add member: ${error.message}` }
  }
}

export async function removeProjectMemberAction(projectId: string, userId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const existingProject = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!existingProject) {
    return { error: 'Project not found' }
  }

  const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  const isCreator = existingProject.createdById === actor.id

  if (!isAdminTier && !isCreator) {
    return { error: 'You do not have permission to modify this project.' }
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: userId }
        }
      }
    })

    revalidatePath(`/project/${projectId}`)
    revalidatePath('/dashboard')
    revalidatePath('/projects')
    return { success: 'Member removed from project successfully.' }
  } catch (error: any) {
    return { error: `Failed to remove member: ${error.message}` }
  }
}

export async function requestToJoinProject(projectId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  // Check if a pending request already exists
  const existingRequest = await prisma.joinRequest.findFirst({
    where: { projectId, userId: actor.id, status: JoinRequestStatus.PENDING }
  })

  if (existingRequest) {
    return { error: 'You already have a pending request for this project.' }
  }

  // Check if already a member
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true }
  })

  if (!project) return { error: 'Project not found.' }
  if (project.members.some(m => m.id === actor.id) || project.teamId === actor.teamId) {
    return { error: 'You are already a member or in the team overseeing this project.' }
  }

  try {
    await prisma.joinRequest.create({
      data: {
        projectId,
        userId: actor.id,
        status: JoinRequestStatus.PENDING
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/projects')
    return { success: 'Join request sent successfully.' }
  } catch (error: any) {
    return { error: `Failed to send join request: ${error.message}` }
  }
}

export async function approveJoinRequest(requestId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  if (!isAdminTier) {
    return { error: 'Unauthorized. Only admin-tier users can approve join requests.' }
  }

  const request = await prisma.joinRequest.findUnique({ where: { id: requestId } })
  if (!request) return { error: 'Request not found.' }
  if (request.status !== JoinRequestStatus.PENDING) return { error: 'Request is no longer pending.' }

  try {
    await prisma.$transaction([
      prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: JoinRequestStatus.APPROVED }
      }),
      prisma.project.update({
        where: { id: request.projectId },
        data: { members: { connect: { id: request.userId } } }
      })
    ])

    revalidatePath('/dashboard')
    revalidatePath(`/project/${request.projectId}`)
    return { success: 'Join request approved.' }
  } catch (error: any) {
    return { error: `Failed to approve join request: ${error.message}` }
  }
}

export async function rejectJoinRequest(requestId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  if (!isAdminTier) {
    return { error: 'Unauthorized. Only admin-tier users can reject join requests.' }
  }

  try {
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: JoinRequestStatus.REJECTED }
    })

    revalidatePath('/dashboard')
    return { success: 'Join request rejected.' }
  } catch (error: any) {
    return { error: `Failed to reject join request: ${error.message}` }
  }
}

