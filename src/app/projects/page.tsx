import { prisma } from '@/utils/prisma'
import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderOpen, Trash2, Pencil, UserPlus, Clock } from 'lucide-react'
import { UserRole, ProjectStatus, JoinRequestStatus } from '@prisma/client'
import { deleteProjectAction, requestToJoinProject } from '@/actions/projectActions'
import { EditProjectModal } from '../dashboard/_components/modals/EditProjectModal'

export default async function ProjectsPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const action = searchParams?.action as string | undefined
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect('/login')
  }

  const isAdmin = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(sessionUser.role)
  const isMember = sessionUser.role === UserRole.MEMBER

  // Fetch projects based on hierarchy
  let projects = await prisma.project.findMany({
    include: { team: true, creator: true, members: true },
    orderBy: { createdAt: 'desc' }
  })
  
  const allTeams = await prisma.team.findMany({ orderBy: { name: 'asc' } })
  const userJoinRequests = await prisma.joinRequest.findMany({
    where: { userId: sessionUser.id, status: JoinRequestStatus.PENDING }
  })

  // Filter based on role
  if (sessionUser.role === UserRole.TEAM_LEAD) {
    projects = projects.filter(p => p.teamId === sessionUser.teamId || p.members.some(m => m.id === sessionUser.id))
  } else if (sessionUser.role === UserRole.MEMBER) {
    // Members only see ACTIVE projects they are NOT part of (to request to join) on this page.
    // Projects they ARE part of are on their dashboard.
    projects = projects.filter(p => {
      if (p.status !== ProjectStatus.ACTIVE) return false
      if (p.members.some(m => m.id === sessionUser.id)) return false
      // If user is in a team, they shouldn't request to join their own team's projects (they are already included via teamId)
      if (sessionUser.teamId && p.teamId === sessionUser.teamId) return false
      return true
    })
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
          <FolderOpen size={24} color="var(--primary)" />
          <h1 className="section-title">{isMember ? "Organization Projects (Joinable)" : "All Projects"}</h1>
        </div>
        
        {projects.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-description">No projects available.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Assigned Team</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const hasPendingRequest = userJoinRequests.some(r => r.projectId === p.id)

                return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{p.title}</td>
                  <td className="body-text">{p.team?.name || 'Cross-Division'}</td>
                  <td>
                    <span className={`chip chip-${
                      p.status === ProjectStatus.ACTIVE ? 'success' : p.status === ProjectStatus.COMPLETED ? 'info' : 'neutral'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="body-text">{p.creator?.name}</td>
                  <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link href={`/project/${p.id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px', height: 'auto' }}>
                      View Details
                    </Link>
                    
                    {isMember && (
                      hasPendingRequest ? (
                        <span style={{ fontSize: '12px', padding: '4px 12px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--surface-variant)', borderRadius: '4px' }}>
                          <Clock size={14} /> Pending
                        </span>
                      ) : (
                        <form action={async () => { 'use server'; await requestToJoinProject(p.id) }}>
                          <button type="submit" className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserPlus size={14} /> Join
                          </button>
                        </form>
                      )
                    )}

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/projects?action=edit-project-${p.id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Pencil size={14} /> Edit
                        </Link>
                        <form action={async () => { 'use server'; await deleteProjectAction(p.id) }}>
                          <button type="submit" className="btn" style={{ fontSize: '12px', padding: '4px 12px', height: 'auto', backgroundColor: 'var(--danger)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {projects.map(p => (
        <EditProjectModal key={p.id} action={action} project={p} teams={allTeams} />
      ))}
    </div>
  )
}
