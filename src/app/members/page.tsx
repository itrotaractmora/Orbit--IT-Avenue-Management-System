import { prisma } from '@/utils/prisma'
import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, UserMinus } from 'lucide-react'
import { UserRole, UserStatus } from '@prisma/client'
import { deactivateUserAction } from '@/actions/userActions'

export default async function MembersPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect('/login')
  }

  const isAdmin = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(sessionUser.role)

  // Fetch users based on hierarchy
  let users = await prisma.user.findMany({
    where: { status: UserStatus.ACTIVE },
    include: { team: true },
    orderBy: { role: 'asc' }
  })

  // Filter based on role
  if (sessionUser.role === UserRole.TEAM_LEAD) {
    users = users.filter(u => u.teamId === sessionUser.teamId || u.id === sessionUser.id)
  } else if (sessionUser.role === UserRole.MEMBER) {
    // Member shouldn't really see full directory, maybe redirect them to dashboard
    redirect('/dashboard')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)', maxWidth: '1000px', margin: '0 auto', paddingTop: 'var(--spacing-24)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ display: 'flex', gap: 'var(--spacing-8)', height: '36px', padding: '0 12px', fontSize: '14px' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
          <Users size={24} color="var(--primary)" />
          <h1 className="section-title">All Members</h1>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Role</th>
              <th>Team</th>
              <th>Email</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{u.name}</span>
                  </div>
                </td>
                <td>
                  <span className="chip" style={{ backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)', textTransform: 'capitalize' }}>
                    {u.role.replace('_', ' ').toLowerCase()}
                  </span>
                </td>
                <td className="body-text">{u.team?.name || 'No Team Assigned'}</td>
                <td className="body-text">{u.email}</td>
                <td style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/profile/${u.id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px', height: 'auto' }}>
                    View Profile
                  </Link>
                  {isAdmin && u.role !== UserRole.PRESIDENT && u.id !== sessionUser.id && (
                    <form action={async () => { 'use server'; await deactivateUserAction(u.id) }}>
                      <button type="submit" className="btn" style={{ fontSize: '12px', padding: '4px 12px', height: 'auto', backgroundColor: 'var(--danger)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserMinus size={14} /> Deactivate
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
