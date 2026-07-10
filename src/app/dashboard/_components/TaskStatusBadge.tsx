import { TaskStatus } from '@prisma/client'
import { CheckCircle2, Clock, PlayCircle, XCircle, Circle } from 'lucide-react'

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case TaskStatus.COMPLETED:
      return (
        <span className="chip chip-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} />
          <span>Completed</span>
        </span>
      )
    case TaskStatus.PENDING_APPROVAL:
      return (
        <span className="chip chip-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          <span>Pending Approval</span>
        </span>
      )
    case TaskStatus.IN_PROGRESS:
      return (
        <span className="chip chip-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <PlayCircle size={12} />
          <span>In Progress</span>
        </span>
      )
    case TaskStatus.REJECTED:
      return (
        <span className="chip chip-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <XCircle size={12} />
          <span>Rejected</span>
        </span>
      )
    case TaskStatus.OPEN:
    default:
      return (
        <span className="chip chip-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Circle size={12} />
          <span>Open</span>
        </span>
      )
  }
}
