import { prisma } from '@/utils/prisma'
import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TaskStatus, UserRole } from '@prisma/client'
import { ProfileExperience } from './_components/ProfileExperience'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect('/login')
  }

  const { id } = await params

  const profileUser = await prisma.user.findUnique({
    where: { id },
    include: {
      team: true,
      assignedTasks: {
        include: {
          project: true,
          creator: true,
          assigner: true,
          assignee: true,
        },
        orderBy: { updatedAt: 'desc' }
      },
      approvedTasks: true
    }
  })

  if (!profileUser) {
    return (
      <div className="empty-state" style={{ marginTop: 'var(--spacing-32)', maxWidth: '720px', marginInline: 'auto' }}>
        <h2 className="section-title">User Not Found</h2>
        <p className="body-text">The profile you are looking for does not exist.</p>
        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 'var(--spacing-16)' }}>Return to Dashboard</Link>
      </div>
    )
  }

  const completedTasks = profileUser.assignedTasks.filter((task) => task.status === TaskStatus.COMPLETED)
  const inFlightTasks = profileUser.assignedTasks.filter((task) => task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.PENDING_APPROVAL)
  const assignedTasks = profileUser.assignedTasks.filter((task) => task.status === TaskStatus.OPEN)
  const approvalRate = profileUser.assignedTasks.length > 0
    ? Math.round((completedTasks.length / profileUser.assignedTasks.length) * 100)
    : 0
  const isOwner = sessionUser.id === profileUser.id
  const canViewInternal = isOwner || ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(sessionUser.role)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return (
    <ProfileExperience
      profileUser={profileUser}
      sessionUser={sessionUser}
      isOwner={isOwner}
      canViewInternal={canViewInternal}
      siteUrl={siteUrl}
      stats={{
        completedTasks,
        inFlightTasks,
        assignedTasks,
        approvalRate,
      }}
    />
  )
}
