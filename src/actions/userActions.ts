'use server'

import { prisma } from '@/utils/prisma'
import { getSessionUser } from './authActions'
import { TaskStatus, UserRole, UserStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendInvitationEmail } from '@/utils/mail'

// Role Hierarchy Verification
function canAddUser(actorRole: UserRole, targetRole: UserRole, actorTeamId: string | null, targetTeamId: string | null): boolean {
  if (actorRole === UserRole.PRESIDENT) {
    return true
  }

  if (actorRole === UserRole.SENIOR_DIRECTOR) {
    // Senior Director can add Senior Directors (peer), Co-Directors, Team Leads, Members
    return true
  }

  if (actorRole === UserRole.CO_DIRECTOR) {
    // Co-Director can add Team Leads, Members
    return targetRole === UserRole.TEAM_LEAD || targetRole === UserRole.MEMBER
  }

  if (actorRole === UserRole.TEAM_LEAD) {
    // Team Lead can add Members to their own team only
    return targetRole === UserRole.MEMBER && targetTeamId !== null && actorTeamId === targetTeamId
  }

  return false
}

export async function onboardUser(prevState: any, formData: FormData) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as UserRole
  const teamId = formData.get('teamId') as string || null

  if (!name || !email || !role) {
    return { error: 'Name, email, and role are required' }
  }

  // Check if role is valid
  if (!Object.values(UserRole).includes(role)) {
    return { error: 'Invalid user role' }
  }

  // Verify Role hierarchy rules
  const allowed = canAddUser(actor.role, role, actor.teamId, teamId)
  if (!allowed) {
    return { error: 'You do not have permission to add a user with this role or team assignment.' }
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email }
  })
  if (existing) {
    return { error: 'User with this email already exists' }
  }

  try {
    // 1. Generate invitation link without sending Supabase's automatic email
    const supabaseAdmin = createAdminClient()
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/confirm`,
        data: { name }
      }
    })

    if (authError || !authData.user || !authData.properties?.action_link) {
      console.error('Supabase Auth error:', authError)
      return { error: `Failed to generate onboarding link: ${authError?.message || 'Unknown error'}` }
    }

    const authUserId = authData.user.id
    const actionLink = authData.properties.action_link

    // 2. Create user in Prisma with matching ID
    const newUser = await prisma.user.create({
      data: {
        id: authUserId,
        name,
        email,
        role,
        teamId: teamId || undefined,
        managerId: actor.id,
        status: UserStatus.ACTIVE
      }
    })

    // If assigning as lead to a team, update the team record
    if (role === UserRole.TEAM_LEAD && teamId) {
      await prisma.team.update({
        where: { id: teamId },
        data: { leadId: newUser.id }
      })
    }

    // Trigger Notification
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        type: 'TASK_ASSIGNED',
      }
    })

    // Log to Audit Trail
    await prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: newUser.id,
        action: 'CREATED',
        actorId: actor.id
      }
    })

    // 3. Send SMTP invitation email using custom Nodemailer mailer
    try {
      await sendInvitationEmail(email, name, role, actionLink)
    } catch (mailError: any) {
      console.error('Failed to send SMTP onboarding email:', mailError)
      // We still return success as user creation succeeded, but log/warn about email delivery.
      return { success: 'User onboarded, but SMTP invitation email failed to send. Please check your SMTP configuration.' }
    }

    revalidatePath('/dashboard')
    return { success: 'User onboarded successfully!' }
  } catch (error: any) {
    return { error: `Failed to onboard user: ${error.message}` }
  }
}

export async function createTeam(prevState: any, formData: FormData) {
  const actor = await getSessionUser()
  if (!actor || !([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)) {
    return { error: 'Unauthorized. Only admin-tier users can create teams.' }
  }

  const name = formData.get('name') as string
  const coDirectorId = formData.get('coDirectorId') as string || null

  if (!name) {
    return { error: 'Team name is required' }
  }

  try {
    const team = await prisma.team.create({
      data: {
        name,
        coDirectorId: coDirectorId || undefined
      }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Team',
        entityId: team.id,
        action: 'CREATED',
        actorId: actor.id
      }
    })

    revalidatePath('/dashboard')
    return { success: 'Team created successfully!' }
  } catch (error: any) {
    return { error: `Failed to create team: ${error.message}` }
  }
}

export async function getUsers() {
  const actor = await getSessionUser()
  if (!actor) return []

  // Admins see everyone
  if (([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)) {
    return prisma.user.findMany({
      include: { team: true, manager: true },
      orderBy: { name: 'asc' }
    })
  }

  // Team Lead sees own team members
  if (actor.role === UserRole.TEAM_LEAD && actor.teamId) {
    return prisma.user.findMany({
      where: { teamId: actor.teamId },
      include: { team: true },
      orderBy: { name: 'asc' }
    })
  }

  // Member sees no lists (only themselves or empty)
  return [actor]
}

export async function getTeams() {
  const actor = await getSessionUser()
  if (!actor) return []

  if (([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)) {
    return prisma.team.findMany({
      include: { lead: true, coDirector: true },
      orderBy: { name: 'asc' }
    })
  }

  if (actor.teamId) {
    return prisma.team.findMany({
      where: { id: actor.teamId },
      include: { lead: true },
      orderBy: { name: 'asc' }
    })
  }

  return []
}

export async function updateProfileAction(input: { isPublicProfile?: boolean; avatar?: File | null; headline?: string; bio?: string; location?: string; skills?: string[] }) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  try {
    const data: Record<string, unknown> = {}

    if (typeof input.isPublicProfile === 'boolean') {
      data.isPublicProfile = input.isPublicProfile
    }

    if (input.headline !== undefined) {
      data.headline = input.headline || null
    }

    if (input.bio !== undefined) {
      data.bio = input.bio || null
    }

    if (input.location !== undefined) {
      data.location = input.location || null
    }

    if (input.skills !== undefined) {
      data.skills = input.skills
    }

    if (input.avatar instanceof File) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
      if (!allowedTypes.includes(input.avatar.type)) {
        return { error: 'Only PNG, JPG, or WebP images are allowed.' }
      }
      if (input.avatar.size > 2 * 1024 * 1024) {
        return { error: 'Avatar image must be 2MB or smaller.' }
      }
      const arrayBuffer = await input.avatar.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      data.avatarUrl = `data:${input.avatar.type};base64,${buffer.toString('base64')}`
    }

    const updatedUser = await prisma.user.update({
      where: { id: actor.id },
      data,
      select: { id: true, avatarUrl: true, isPublicProfile: true }
    })

    revalidatePath(`/profile/${actor.id}`)
    return { success: true, avatarUrl: updatedUser.avatarUrl, isPublicProfile: updatedUser.isPublicProfile }
  } catch (error: any) {
    return { error: `Failed to update profile: ${error.message}` }
  }
}

export async function updateTaskStatusAction(taskId: string, nextStatus: TaskStatus) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) {
    return { error: 'Task not found.' }
  }

  if (task.assignedToId !== actor.id) {
    return { error: 'Only the assignee can update this task status.' }
  }

  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.OPEN]: [TaskStatus.IN_PROGRESS],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.PENDING_APPROVAL, TaskStatus.COMPLETED],
    [TaskStatus.PENDING_APPROVAL]: [TaskStatus.COMPLETED],
    [TaskStatus.COMPLETED]: [],
    [TaskStatus.REJECTED]: [TaskStatus.IN_PROGRESS]
  }

  if (!validTransitions[task.status]?.includes(nextStatus)) {
    return { error: 'That task transition is not allowed.' }
  }

  try {
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: nextStatus }
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: 'UPDATED',
        actorId: actor.id
      }
    })

    revalidatePath(`/profile/${actor.id}`)
    revalidatePath('/dashboard')
    return { success: true, task: updatedTask }
  } catch (error: any) {
    return { error: `Failed to update task: ${error.message}` }
  }
}

export async function deactivateUserAction(userId: string) {
  const actor = await getSessionUser()
  if (!actor || actor.status !== UserStatus.ACTIVE) {
    return { error: 'Unauthorized' }
  }

  const isAdmin = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(actor.role)
  if (!isAdmin) {
    return { error: 'Unauthorized. Only admin-tier users can deactivate members.' }
  }

  // Prevent self-deactivation
  if (actor.id === userId) {
    return { error: 'You cannot deactivate yourself.' }
  }

  try {
    const userToDeactivate = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!userToDeactivate) {
      return { error: 'User not found.' }
    }

    // Protect President
    if (userToDeactivate.role === UserRole.PRESIDENT) {
      return { error: 'The President cannot be deactivated.' }
    }

    // 1. Set to INACTIVE in Prisma
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.INACTIVE }
    })

    // 2. Ban in Supabase to block login (Requires Supabase Admin API)
    const supabaseAdmin = createAdminClient()
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h' // approx 100 years
    })

    if (banError) {
      console.error('Failed to ban in Supabase:', banError.message)
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: userId,
        action: 'DEACTIVATED',
        actorId: actor.id
      }
    })

    revalidatePath('/members')
    revalidatePath('/dashboard')
    return { success: 'User has been deactivated successfully.' }
  } catch (error: any) {
    return { error: `Failed to deactivate user: ${error.message}` }
  }
}
