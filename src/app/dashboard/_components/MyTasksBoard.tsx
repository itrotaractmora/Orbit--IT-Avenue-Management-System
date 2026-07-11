import { CheckCircle2 } from 'lucide-react'
import { TaskStatus } from '@prisma/client'
import { submitTask, dropClaim } from '@/actions/taskActions'
import { TaskStatusBadge } from './TaskStatusBadge'
import { OverdueBadge } from './OverdueBadge'
import Link from 'next/link'

export function MyTasksBoard({ myTasks }: { myTasks: any[] }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <h2 className="section-title">Active Task Board</h2>
      {myTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="empty-state-title">No assigned tasks</div>
          <div className="empty-state-description">Your queue is currently clear. Claim an open task from the system queue.</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myTasks.map(t => {
                const latestRejection = t.approvals?.find((a: any) => a.decision === 'REJECTED')
                const rejectionComment = latestRejection?.comment
                return (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/task/${t.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }} className="hover-underline">
                        {t.title}
                      </Link>
                      {t.dueDate && (
                        <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Due: {new Date(t.dueDate).toLocaleDateString()}
                          <OverdueBadge dueDate={t.dueDate} status={t.status} />
                        </div>
                      )}
                      {t.status === TaskStatus.REJECTED && rejectionComment && (
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--danger)',
                          backgroundColor: 'var(--danger-bg)',
                          border: '1px solid rgba(239, 68, 68, 0.1)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          marginTop: '6px',
                          display: 'inline-block'
                        }}>
                          <strong>Rejection Comment:</strong> {rejectionComment}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`chip chip-${
                        t.priority === 'URGENT' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'info'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <TaskStatusBadge status={t.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.REJECTED) && (
                          <form action={async () => {
                            'use server'
                            await submitTask(t.id)
                          }}>
                            <button className="btn btn-primary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                              Submit
                            </button>
                          </form>
                        )}
                        
                        {(t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.OPEN) && (
                          <form action={async (formData: FormData) => {
                            'use server'
                            const reason = formData.get('reason') as string
                            await dropClaim(t.id, reason)
                          }} style={{ display: 'flex', gap: '4px' }}>
                            <input
                              className="form-input"
                              name="reason"
                              placeholder="Drop reason..."
                              required
                              style={{ height: '32px', padding: '4px 8px', fontSize: '12px', width: '120px' }}
                            />
                            <button className="btn btn-secondary" style={{ height: '32px', fontSize: '12px', padding: '0 12px', borderRadius: '8px' }} type="submit">
                              Drop
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
