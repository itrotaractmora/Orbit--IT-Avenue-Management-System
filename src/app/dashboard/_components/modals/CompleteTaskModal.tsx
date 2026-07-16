'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { submitTaskForApprovalAction } from '@/actions/taskActions'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'

export function CompleteTaskModal({ 
  action, 
  task, 
  returnUrl = '/dashboard'
}: { 
  action: string | undefined, 
  task: any, 
  returnUrl?: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(submitTaskForApprovalAction, null)

  useEffect(() => {
    if (state?.success) {
      router.push(`${returnUrl}${returnUrl.includes('?') ? '&' : '?'}toast=Task submitted for approval!`)
    }
  }, [state?.success, router, returnUrl])

  if (action !== `complete-task-${task?.id}` || !task) return null

  return (
    <div className="glass-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-24)' }}>
          <h3 className="card-title">Complete Task</h3>
          <Link href={returnUrl} style={{ color: 'var(--on-surface-variant)' }}>
            <X size={18} />
          </Link>
        </div>
        
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <input type="hidden" name="taskId" value={task.id} />
          
          <div style={{ fontSize: '14px', color: 'var(--on-surface)' }}>
            You are about to complete the task: <strong>{task.title}</strong>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="taskComment">Submission Note (Optional)</label>
            <textarea 
              className="form-textarea" 
              id="taskComment" 
              name="comment" 
              placeholder="Add any notes about your work here..." 
              style={{ minHeight: '100px' }}
            />
          </div>

          {state?.error && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', backgroundColor: 'var(--danger-bg)', padding: '8px 12px', borderRadius: '4px' }}>
              {state.error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-12)', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
            <Link href={returnUrl} className="btn btn-secondary">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Complete Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
