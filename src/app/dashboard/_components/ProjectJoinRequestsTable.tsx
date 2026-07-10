import { FolderOpen, UserCheck, XCircle } from 'lucide-react'
import { approveJoinRequest, rejectJoinRequest } from '@/actions/projectActions'

export function ProjectJoinRequestsTable({ requests }: { requests: any[] }) {
  if (requests.length === 0) return null

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <h2 className="section-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
        <FolderOpen size={20} />
        <span>Project Join Requests</span>
      </h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Requested By</th>
              <th>Date Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{r.project?.title}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--border)',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--on-surface-variant)'
                    }}>
                      {r.user ? getInitials(r.user.name) : 'U'}
                    </div>
                    <span>{r.user?.name || 'Unknown User'}</span>
                  </div>
                </td>
                <td className="body-text">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <form action={async () => {
                      'use server'
                      await approveJoinRequest(r.id)
                    }}>
                      <button className="btn btn-primary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }} type="submit">
                        <UserCheck size={14} /> Approve
                      </button>
                    </form>
                    
                    <form action={async () => {
                      'use server'
                      await rejectJoinRequest(r.id)
                    }}>
                      <button className="btn btn-danger" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }} type="submit">
                        <XCircle size={14} /> Reject
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
