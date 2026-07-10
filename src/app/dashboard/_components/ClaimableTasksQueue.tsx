import { Users } from 'lucide-react'
import Link from 'next/link'
import { claimTask } from '@/actions/taskActions'
import { OverdueBadge } from './OverdueBadge'

export function ClaimableTasksQueue({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) return null

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
        <Users size={20} />
        <span>Open Tasks Queue</span>
      </h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Project</th>
              <th>Priority</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td>
                  <Link href={`/task/${t.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }} className="hover-underline">
                    {t.title}
                  </Link>
                  <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{t.description}</div>
                </td>
                <td className="body-text">{t.project ? t.project.title : 'General Task'}</td>
                <td>
                  <span className={`chip chip-${
                    t.priority === 'URGENT' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'info'
                  }`}>
                    {t.priority}
                  </span>
                </td>
                <td>
                  <form action={async () => {
                    'use server'
                    await claimTask(t.id)
                  }}>
                    <button className="btn btn-secondary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                      Claim
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
