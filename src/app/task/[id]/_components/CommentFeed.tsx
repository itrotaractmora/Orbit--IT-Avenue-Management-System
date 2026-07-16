'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addCommentAction, deleteCommentAction } from '@/actions/commentActions'
import { UserRole } from '@prisma/client'
import { Send, Trash2 } from 'lucide-react'
import Image from 'next/image'

export function CommentFeed({ taskId, comments, currentUser }: { taskId: string, comments: any[], currentUser: any }) {
  const [state, formAction, isPending] = useActionState(addCommentAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset()
    }
  }, [state])

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  const isAdminTier = ([UserRole.PRESIDENT, UserRole.SENIOR_DIRECTOR, UserRole.CO_DIRECTOR] as UserRole[]).includes(currentUser.role)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)', height: '100%' }}>
      <h2 className="section-title">Activity & Comments</h2>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)', paddingRight: '4px' }}>
        {comments.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-state-title" style={{ fontSize: '14px' }}>No comments yet</div>
            <div className="empty-state-description" style={{ fontSize: '13px' }}>Be the first to share an update on this task.</div>
          </div>
        ) : (
          comments.map(comment => {
            const isOwner = comment.userId === currentUser.id
            const canDelete = isAdminTier || isOwner

            return (
              <div key={comment.id} style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'flex-start' }}>
                {comment.user.avatarUrl ? (
                  <Image src={comment.user.avatarUrl} alt="Avatar" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                    {getInitials(comment.user.name)}
                  </div>
                )}
                
                <div style={{ flex: 1, backgroundColor: 'var(--surface-variant)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--on-surface)' }}>
                      {comment.user.name} 
                      {isOwner && <span style={{ fontWeight: 'normal', color: 'var(--on-surface-variant)', marginLeft: '4px' }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                      {canDelete && (
                        <form action={async () => {
                          if (confirm('Are you sure you want to delete this comment?')) {
                            await deleteCommentAction(comment.id, taskId)
                          }
                        }}>
                          <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: '2px', display: 'flex', alignItems: 'center' }} title="Delete comment">
                            <Trash2 size={14} className="hover-danger" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--on-surface)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {comment.content}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-16)', borderTop: '1px solid var(--border)' }}>
        <form ref={formRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input type="hidden" name="taskId" value={taskId} />
          <textarea 
            name="content" 
            className="form-textarea" 
            placeholder="Write a comment..." 
            rows={3} 
            required 
            style={{ resize: 'none' }}
          />
          {state?.error && (
            <div style={{ color: 'var(--danger)', fontSize: '12px', backgroundColor: 'var(--danger-bg)', padding: '6px 8px', borderRadius: '4px' }}>
              {state.error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ height: '32px', fontSize: '13px', padding: '0 16px', display: 'flex', gap: '6px' }} disabled={isPending}>
              <Send size={14} />
              {isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
