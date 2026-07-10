'use server'

import { prisma } from '@/utils/prisma'
import { getSessionUser } from './authActions'
import { revalidatePath } from 'next/cache'

export async function dismissNotification(id: string) {
  const user = await getSessionUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.notification.update({
      where: { id, userId: user.id },
      data: { read: true }
    })
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: 'Failed to dismiss notification' }
  }
}

export async function dismissAllNotifications() {
  const user = await getSessionUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    })
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { error: 'Failed to dismiss notifications' }
  }
}
