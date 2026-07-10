import { TaskStatus } from '@prisma/client'

export function OverdueBadge({ dueDate, status }: { dueDate: Date | null, status: TaskStatus }) {
  if (!dueDate || status === TaskStatus.COMPLETED) return null

  const now = new Date()
  if (new Date(dueDate) < now) {
    return <span className="badge-overdue">Overdue</span>
  }
  
  return null
}
