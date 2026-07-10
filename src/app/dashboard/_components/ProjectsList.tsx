import { FolderOpen } from 'lucide-react'
import { ProjectStatus } from '@prisma/client'
import { updateProjectStatus } from '@/actions/projectActions'

export function ProjectsList({ projects, isAdmin }: { projects: any[], isAdmin: boolean }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <h2 className="title-md">Projects</h2>
      {projects.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--spacing-24)' }}>
          <div className="empty-state-icon" style={{ padding: 'var(--spacing-8)' }}>
            <FolderOpen size={20} />
          </div>
          <div className="empty-state-title" style={{ fontSize: '14px' }}>No active projects</div>
          <div className="empty-state-description" style={{ fontSize: '12px' }}>Create projects to organize development tasks.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          {projects.map(p => (
            <div key={p.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--spacing-12)' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>{p.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{p.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-8)' }}>
                <span className={`chip chip-${
                  p.status === ProjectStatus.ACTIVE ? 'success' : p.status === ProjectStatus.COMPLETED ? 'info' : 'neutral'
                }`} style={{ fontSize: '10px' }}>
                  {p.status}
                </span>
                {isAdmin && p.status === ProjectStatus.ACTIVE && (
                  <form action={async () => {
                    'use server'
                    await updateProjectStatus(p.id, ProjectStatus.COMPLETED)
                  }}>
                    <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '2px 8px' }} type="submit">
                      Complete
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
