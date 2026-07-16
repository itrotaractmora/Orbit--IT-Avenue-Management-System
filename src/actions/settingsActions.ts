'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/utils/prisma'
import { getSessionUser } from './authActions'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(prevState: any, formData: FormData) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const avatarUrl = formData.get('avatarUrl') as string

  if (!name || name.trim() === '') {
    return { error: 'Name is required' }
  }

  try {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl ? avatarUrl.trim() : null
      }
    })
    
    // Attempt to update the name in Supabase auth metadata as well, though not strictly required
    const supabase = await createClient()
    await supabase.auth.updateUser({
      data: { name: name.trim() }
    })

    revalidatePath('/') // Revalidate everything to show new name/avatar
    return { success: 'Profile updated successfully!' }
  } catch (error: any) {
    console.error('Failed to update profile:', error)
    return { error: 'Failed to update profile' }
  }
}

export async function updateEmailAction(prevState: any, formData: FormData) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { error: 'Not authenticated' }

  const email = formData.get('email') as string

  if (!email || !email.includes('@')) {
    return { error: 'A valid email is required' }
  }

  if (email === sessionUser.email) {
    return { success: 'Email is already up to date.' }
  }

  try {
    const supabase = await createClient()
    
    // Supabase handles the actual email change, sending confirmations if configured.
    const { data, error } = await supabase.auth.updateUser({ email })
    
    if (error) {
      return { error: error.message }
    }

    // NOTE: Do NOT update Prisma email here. Supabase requires email confirmation
    // before the change takes effect. The Prisma email should be updated only after
    // the user confirms the new email (e.g., via the auth callback or a webhook).

    revalidatePath('/')
    return { success: 'A confirmation email has been sent to your new address. Your email will be updated once you confirm it.' }
  } catch (error: any) {
    console.error('Failed to update email:', error)
    return { error: 'Failed to update email' }
  }
}

export async function updatePasswordAction(prevState: any, formData: FormData) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { error: 'Not authenticated' }

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      return { error: error.message }
    }

    return { success: 'Password updated successfully!' }
  } catch (error: any) {
    console.error('Failed to update password:', error)
    return { error: 'Failed to update password' }
  }
}
