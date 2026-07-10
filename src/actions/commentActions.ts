'use server'

import { prisma } from '@/utils/prisma'
import { getSessionUser } from './authActions'
import { revalidatePath } from 'next/cache'
import { UserRole } from '@prisma/client'

export async function addCommentAction(prevState: any, formData: FormData) {
  const user = await getSessionUser()
  if (!user) return { error: 'Not authenticated' }

  const taskId = formData.get('taskId') as string
  const content = formData.get('content') as string

  if (!taskId) return { error: 'Task ID is required' }
  if (!content || content.trim().length === 0) return { error: 'Comment content cannot be empty' }

  try {
    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: user.id,
        content: content.trim()
      }
    })

    // Optionally notify the task assignee / creator if they aren't the ones commenting
    // This could be a future enhancement.

    revalidatePath(`/task/${taskId}`)
    revalidatePath('/dashboard') // In case recent activity panels are added later
    return { success: 'Comment added successfully' }
  } catch (error: any) {
    console.error('Failed to add comment:', error)
    return { error: 'Failed to add comment' }
  }
}

export async function deleteCommentAction(commentId: string, taskId: string) {
  const user = await getSessionUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) return { error: 'Comment not found' }

    const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(user.role)
    const isOwner = comment.userId === user.id

    if (!isAdminTier && !isOwner) {
      return { error: 'Not authorized to delete this comment' }
    }

    await prisma.comment.delete({ where: { id: commentId } })

    revalidatePath(`/task/${taskId}`)
    return { success: 'Comment deleted successfully' }
  } catch (error: any) {
    console.error('Failed to delete comment:', error)
    return { error: 'Failed to delete comment' }
  }
}
