'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/utils/prisma'
import { redirect } from 'next/navigation'
import { UserRole, UserStatus } from '@prisma/client'

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data?.user) {
    const sbUser = data.user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.id !== sbUser.id) {
      try {
        await prisma.$executeRaw`
          UPDATE "User"
          SET id = ${sbUser.id}::uuid,
              status = ${UserStatus.ACTIVE}::"UserStatus"
          WHERE id = ${existingUser.id}::uuid
        `;
      } catch (dbError) {
        console.error('Failed to sync profile during login:', dbError);
      }
    }
  }

  redirect('/dashboard')
}

export async function signupAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as UserRole
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!name || !email || !role || !password || !confirmPassword) {
    return { error: 'Name, email, role, password, and confirm password are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  if (!email.endsWith('rotaractmora@gmail.com')) {
    return { error: 'Registration is restricted to rotaractmora@gmail.com emails' }
  }

  if (role !== UserRole.PRESIDENT && role !== UserRole.SENIOR_DIRECTOR && role !== UserRole.CO_DIRECTOR) {
    return { error: 'Invalid role selected. Must be President, Senior Director, or Co-director.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        self_signed: true,
      },
    },
  })

  if (error) {
    const isAlreadyRegistered =
      error.message?.toLowerCase().includes('already registered') ||
      error.message?.toLowerCase().includes('already exists') ||
      error.status === 400;

    if (isAlreadyRegistered) {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (resendError) {
        return { error: resendError.message || error.message }
      }

      // Sync name & role to database if they exist in Prisma
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser) {
        try {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name,
              role,
            }
          })
        } catch (dbError) {
          console.error('Failed to update profile during resend:', dbError)
        }
      }

      return { success: true, email }
    }
    return { error: error.message }
  }

  const sbUser = data.user
  if (!sbUser) {
    return { error: 'User registration failed' }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  try {
    if (existingUser) {
      if (existingUser.id !== sbUser.id) {
        await prisma.$executeRaw`
          UPDATE "User"
          SET id = ${sbUser.id}::uuid,
              name = ${name},
              role = ${role}::"UserRole",
              status = ${UserStatus.ACTIVE}::"UserStatus"
          WHERE id = ${existingUser.id}::uuid
        `;
      } else {
        await prisma.user.update({
          where: { id: sbUser.id },
          data: {
            name,
            role,
            status: UserStatus.ACTIVE,
          }
        });
      }
    } else {
      await prisma.user.create({
        data: {
          id: sbUser.id,
          name,
          email,
          role,
          status: UserStatus.ACTIVE,
        },
      })
    }
  } catch (dbError: any) {
    return { error: `Database profile sync failed: ${dbError.message}` }
  }

  return { success: true, email }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
export async function getSessionUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        team: true,
        manager: true,
      }
    })
    return dbUser
  } catch {
    return null
  }
}

export async function updatePasswordAction(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Both password fields are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}
