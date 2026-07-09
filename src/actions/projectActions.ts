'use server'

import { prisma } from '@/utils/prisma'
import { getSessionUser } from './authActions'
import { UserRole, ProjectStatus, UserStatus } from '@prisma/client'
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
      include: { creator: true, team: true, tasks: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Team Lead sees projects assigned to their team
  if (actor.role === UserRole.TEAM_LEAD && actor.teamId) {
    return prisma.project.findMany({
      where: { teamId: actor.teamId },
      include: { creator: true, team: true, tasks: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Members see active projects assigned to their team
  if (actor.role === UserRole.MEMBER && actor.teamId) {
    return prisma.project.findMany({
      where: {
        teamId: actor.teamId,
        status: ProjectStatus.ACTIVE
      },
      include: { creator: true, team: true, tasks: true },
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
