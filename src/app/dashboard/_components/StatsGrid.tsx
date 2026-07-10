import { CheckCircle2, AlertCircle, Users, FileText } from 'lucide-react'

interface StatsGridProps {
  completionRate: number
  completedTasks: number
  totalTasks: number
  overdueTasks: number
  teamsCount: number
  pendingApprovalsCount: number
}

export function StatsGrid({ 
  completionRate, 
  completedTasks, 
  totalTasks, 
  overdueTasks, 
  teamsCount, 
  pendingApprovalsCount 
}: StatsGridProps) {
  return (
    <div className="grid-dashboard">
      <div className="card col-3 stat-card">
        <div className="stat-label">Completion Rate</div>
        <div className="stat-value">{completionRate}%</div>
        <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
          <span>{completedTasks} of {totalTasks} finished</span>
        </div>
      </div>
      
      <div className="card col-3 stat-card">
        <div className="stat-label">Overdue Tasks</div>
        <div className="stat-value" style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--success)' }}>
          {overdueTasks}
        </div>
        <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={12} style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--success)' }} />
          <span>Awaiting resolution</span>
        </div>
      </div>

      <div className="card col-3 stat-card">
        <div className="stat-label">Total Teams</div>
        <div className="stat-value">{teamsCount}</div>
        <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Users size={12} />
          <span>Active department units</span>
        </div>
      </div>

      <div className="card col-3 stat-card">
        <div className="stat-label">Pending Approvals</div>
        <div className="stat-value" style={{ color: pendingApprovalsCount > 0 ? 'var(--warning)' : 'var(--on-surface-variant)' }}>
          {pendingApprovalsCount}
        </div>
        <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={12} style={{ color: pendingApprovalsCount > 0 ? 'var(--warning)' : 'var(--on-surface-variant)' }} />
          <span>Awaiting reviews</span>
        </div>
      </div>
    </div>
  )
}
