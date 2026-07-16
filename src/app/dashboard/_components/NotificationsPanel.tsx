import { Info, FileText, Clock, XCircle, AlertTriangle, Bell, Check } from 'lucide-react'
import { dismissNotification, dismissAllNotifications } from '@/actions/notificationActions'

function NotificationItem({ n }: { n: any }) {
  let icon = <Info size={16} />
  let badgeColor = 'var(--info-bg)'
  let textColor = 'var(--info)'
  let label = n.type.replace(/_/g, ' ')

  if (n.type === 'TASK_ASSIGNED') {
    icon = <FileText size={16} />
    badgeColor = 'var(--info-bg)'
    textColor = 'var(--info)'
  } else if (n.type === 'APPROVAL_NEEDED') {
    icon = <Clock size={16} />
    badgeColor = 'var(--warning-bg)'
    textColor = 'var(--warning)'
  } else if (n.type === 'TASK_REJECTED') {
    icon = <XCircle size={16} />
    badgeColor = 'var(--danger-bg)'
    textColor = 'var(--danger)'
  } else if (n.type === 'TASK_OVERDUE') {
    icon = <AlertTriangle size={16} />
    badgeColor = 'var(--danger-bg)'
    textColor = 'var(--danger)'
  }

  async function handleDismiss() {
    'use server'
    await dismissNotification(n.id)
  }
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px 24px',
      borderBottom: '1px solid var(--border)',
      fontSize: '14px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        backgroundColor: badgeColor,
        color: textColor,
        flexShrink: 0,
        marginTop: '2px'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: textColor
          }}>
            {label}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p style={{ color: 'var(--on-surface)', marginTop: '4px', lineHeight: '1.4' }}>
          {n.type === 'TASK_ASSIGNED' && (n.task?.status === 'COMPLETED'
            ? `Your task "${n.task?.title || 'Untitled'}" has been approved and marked as completed.`
            : `You have been assigned to task "${n.task?.title || 'Untitled'}"`
          )}
          {n.type === 'APPROVAL_NEEDED' && `Task "${n.task?.title || 'Untitled'}" is pending your approval review.`}
          {n.type === 'TASK_REJECTED' && `Your task "${n.task?.title || 'Untitled'}" was rejected.`}
          {n.type === 'TASK_OVERDUE' && `Task "${n.task?.title || 'Untitled'}" is overdue!`}
        </p>
      </div>
      <form action={handleDismiss}>
        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }} type="submit">
          Dismiss
        </button>
      </form>
    </div>
  )
}

export function NotificationsPanel({ notifications }: { notifications: any[] }) {
  if (notifications.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-24)', overflow: 'hidden', padding: 0 }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--surface)'
      }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px' }}>
          <Bell size={18} style={{ color: 'var(--primary)' }} />
          <span>Notifications</span>
          <span className="badge" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>{notifications.length}</span>
        </h3>
        <form action={async () => { 'use server'; await dismissAllNotifications(); }}>
          <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>
            <Check size={14} style={{ marginRight: '4px' }} />
            Dismiss All
          </button>
        </form>
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {notifications.map(n => <NotificationItem key={n.id} n={n} />)}
      </div>
    </div>
  )
}
