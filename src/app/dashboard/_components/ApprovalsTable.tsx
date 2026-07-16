import { FileText, Clock } from 'lucide-react'
import { decideApproval } from '@/actions/taskActions'
import { ApprovalDecision } from '@prisma/client'
import { OverdueBadge } from './OverdueBadge'

export function ApprovalsTable({ approvals, userId }: { approvals: any[], userId: string }) {
  if (approvals.length === 0) return null

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <h2 className="section-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
        <FileText size={20} />
        <span>Approvals Pipeline</span>
      </h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{t.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{t.description}</div>
                  {t.comments && t.comments.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--surface-variant)',
                      borderLeft: '2px solid var(--primary)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: 'var(--on-surface)'
                    }}>
                      <strong>Submission Note:</strong> {t.comments[0].content}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {t.assignees && t.assignees.length > 0 ? (
                      t.assignees.map((assignee: any) => (
                        <div key={assignee.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            color: 'var(--on-surface-variant)',
                            flexShrink: 0
                          }}>
                            {getInitials(assignee.name)}
                          </div>
                          <span style={{ fontSize: '13px' }}>{assignee.name}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="body-text">
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                  <OverdueBadge dueDate={t.dueDate} status={t.status} />
                </td>
                <td>
                  {t.assignees?.some((u: any) => u.id === userId) ? (
                    <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      Awaiting peer approval
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <form action={async () => {
                        'use server'
                        const res = await decideApproval(t.id, ApprovalDecision.APPROVED)
                        if (res?.error) {
                          const { redirect } = await import('next/navigation')
                          redirect(`/dashboard?toast=${encodeURIComponent(res.error)}`)
                        } else if (res?.success) {
                          const { redirect } = await import('next/navigation')
                          redirect(`/dashboard?toast=${encodeURIComponent(res.success)}`)
                        }
                      }}>
                        <button className="btn btn-primary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                          Approve
                        </button>
                      </form>
                      
                      <form action={async (formData: FormData) => {
                        'use server'
                        const comment = formData.get('comment') as string
                        const res = await decideApproval(t.id, ApprovalDecision.REJECTED, comment)
                        if (res?.error) {
                          const { redirect } = await import('next/navigation')
                          redirect(`/dashboard?toast=${encodeURIComponent(res.error)}`)
                        } else if (res?.success) {
                          const { redirect } = await import('next/navigation')
                          redirect(`/dashboard?toast=${encodeURIComponent(res.success)}`)
                        }
                      }} style={{ display: 'flex', gap: '4px' }}>
                        <input
                          className="form-input"
                          name="comment"
                          placeholder="Reopen reason..."
                          required
                          style={{ height: '32px', padding: '4px 8px', fontSize: '12px', width: '130px' }}
                        />
                        <button className="btn btn-secondary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                          Reopen / Reject
                        </button>
                      </form>
                    </div>
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
