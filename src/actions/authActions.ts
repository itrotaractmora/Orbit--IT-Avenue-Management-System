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
  const password = formData.get('password') as string

  if (!name || !email || !password) {
    return { error: 'Name, email, and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) {
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
              status = ${UserStatus.ACTIVE}::"UserStatus"
          WHERE id = ${existingUser.id}::uuid
        `;
      } else {
        await prisma.user.update({
          where: { id: sbUser.id },
          data: {
            name,
            status: UserStatus.ACTIVE,
          }
        });
      }
    } else {
      const userCount = await prisma.user.count()
      const assignedRole = userCount === 0 ? UserRole.PRESIDENT : UserRole.MEMBER
      await prisma.user.create({
        data: {
          id: sbUser.id,
          name,
          email,
          role: assignedRole,
          status: UserStatus.ACTIVE,
        },
      })
    }
  } catch (dbError: any) {
    return { error: `Database profile sync failed: ${dbError.message}` }
  }

  redirect('/dashboard')
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
