'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { prisma } from '@/utils/prisma'
import { redirect } from 'next/navigation'
import { UserRole, UserStatus } from '@prisma/client'
import { sendSignupOtpEmail } from '@/utils/mail'

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

  const adminClient = createAdminClient()

  // Check if the user already exists in Supabase
  let sbUserId: string | null = null
  try {
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
    if (listError) {
      return { error: `Failed to verify email state: ${listError.message}` }
    }
    const sbUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (sbUser) {
      if (sbUser.email_confirmed_at) {
        return { error: 'Email is already registered. Please log in.' }
      }
      
      // User exists but unconfirmed, update password and metadata
      const { error: updateError } = await adminClient.auth.admin.updateUserById(sbUser.id, {
        password,
        user_metadata: { name, self_signed: true }
      })
      if (updateError) {
        return { error: updateError.message }
      }
      sbUserId = sbUser.id
    }
  } catch (err: any) {
    return { error: `Error checking existing user: ${err.message}` }
  }

  // Create user if not exists
  if (!sbUserId) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name,
        self_signed: true,
      },
    })

    if (error || !data.user) {
      return { error: error?.message || 'User registration failed' }
    }
    sbUserId = data.user.id
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  // Generate standard verification OTP using generateLink
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      redirectTo: `${siteUrl}/auth/confirm`,
    }
  })

  if (linkError || !linkData.properties?.email_otp) {
    return { error: linkError?.message || 'Failed to generate verification code' }
  }

  const otp = linkData.properties.email_otp
  const link = linkData.properties.action_link

  // Send email using custom Nodemailer SMTP
  try {
    await sendSignupOtpEmail(email, otp, link)
  } catch (mailError: any) {
    console.error('Failed to send verification email:', mailError)
    return { error: 'Failed to send verification email. Please check your SMTP settings.' }
  }

  // Sync profile details to database
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  try {
    if (existingUser) {
      if (existingUser.id !== sbUserId) {
        await prisma.$executeRaw`
          UPDATE "User"
          SET id = ${sbUserId}::uuid,
              name = ${name},
              role = ${role}::"UserRole",
              status = ${UserStatus.ACTIVE}::"UserStatus"
          WHERE id = ${existingUser.id}::uuid
        `;
      } else {
        await prisma.user.update({
          where: { id: sbUserId },
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
          id: sbUserId,
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

  return { success: true, email, password }
}

export async function resendSignupOtpAction(email: string, password?: string) {
  if (!email || !email.endsWith('rotaractmora@gmail.com')) {
    return { error: 'Registration is restricted to rotaractmora@gmail.com emails' }
  }

  if (!password) {
    return { error: 'Password is required to resend verification code' }
  }

  try {
    const adminClient = createAdminClient()

    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
    if (listError) {
      return { error: `Failed to check account state: ${listError.message}` }
    }

    const sbUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!sbUser) {
      return { error: 'No unverified registration found for this email address.' }
    }

    if (sbUser.email_confirmed_at) {
      return { error: 'This email is already verified. Please log in.' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${siteUrl}/auth/confirm`,
      }
    })

    if (linkError || !linkData.properties?.email_otp) {
      return { error: linkError?.message || 'Failed to generate verification code' }
    }

    const otp = linkData.properties.email_otp
    const link = linkData.properties.action_link
    await sendSignupOtpEmail(email, otp, link)

    return { success: true }
  } catch (err: any) {
    console.error('Failed to resend verification OTP:', err)
    return { error: err.message || 'An error occurred while resending verification' }
  }
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
