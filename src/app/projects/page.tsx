import { prisma } from '@/utils/prisma'
import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import { UserRole, ProjectStatus } from '@prisma/client'

export default async function ProjectsPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    redirect('/login')
  }

  // Fetch projects based on hierarchy
  let projects = await prisma.project.findMany({
    include: { team: true, creator: true },
    orderBy: { createdAt: 'desc' }
  })

  // Filter based on role
  if (sessionUser.role === UserRole.TEAM_LEAD) {
    projects = projects.filter(p => p.teamId === sessionUser.teamId)
  } else if (sessionUser.role === UserRole.MEMBER) {
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
          <FolderOpen size={24} color="var(--primary)" />
          <h1 className="section-title">All Projects</h1>
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
              {projects.map(p => (
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
                  <td>
                    <Link href={`/project/${p.id}`} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px', height: 'auto' }}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
