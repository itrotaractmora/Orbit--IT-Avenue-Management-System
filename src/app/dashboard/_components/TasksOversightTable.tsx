'use client'

import { useState } from 'react'
import { TaskStatus } from '@prisma/client'
import { TaskStatusBadge } from './TaskStatusBadge'
import { reassignTask } from '@/actions/taskActions'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface TasksOversightTableProps {
  tasks: any[]
  users: any[]
}

export function TasksOversightTable({ tasks, users }: TasksOversightTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  // Filter
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.assignee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.project?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Paginate
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleReassign = async (taskId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const targetUserId = formData.get('assigneeId') as string
    if (targetUserId) {
      await reassignTask(taskId, targetUserId)
    }
  }

  const exportCSV = () => {
    const headers = ['Task Title', 'Assignee', 'Project', 'Status', 'Due Date']
    const rows = filteredTasks.map(t => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.assignee?.name || 'Unassigned'}"`,
      `"${t.project?.title || 'General Task'}"`,
      `"${t.status}"`,
      `"${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}"`
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'tasks_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Tasks Oversight</h2>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-12)', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={exportCSV} style={{ height: '36px', fontSize: '12px' }}>
            Export CSV
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ paddingLeft: '32px', height: '36px', width: '200px' }}
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="form-select"
            style={{ height: '36px' }}
          >
            <option value="ALL">All Statuses</option>
            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Project</th>
              <th>Status</th>
              <th>Reassign</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--on-surface-variant)' }}>
                  No tasks found.
                </td>
              </tr>
            ) : paginatedTasks.map(t => {
              const latestRejection = t.approvals?.find((a: any) => a.decision === 'REJECTED')
              const rejectionComment = latestRejection?.comment
              return (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{t.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Priority: {t.priority}</div>
                    {t.status === TaskStatus.REJECTED && rejectionComment && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--danger)',
                        backgroundColor: 'var(--danger-bg)',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        marginTop: '4px',
                        display: 'inline-block'
                      }}>
                        <strong>Reason:</strong> {rejectionComment}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontSize: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {t.assignee ? getInitials(t.assignee.name) : 'U'}
                      </div>
                      {t.assignee ? (
                        <Link href={`/profile/${t.assignee.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                          {t.assignee.name}
                        </Link>
                      ) : (
                        <span>Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="body-text">
                    {t.project ? (
                      <Link href={`/project/${t.project.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {t.project.title}
                      </Link>
                    ) : (
                      'General Task'
                    )}
                  </td>
                  <td>
                    <TaskStatusBadge status={t.status} />
                  </td>
                  <td>
                    <form onSubmit={(e) => handleReassign(t.id, e)} style={{ display: 'flex', gap: '4px' }}>
                      <select className="form-select" name="assigneeId" style={{ height: '32px', padding: '4px', fontSize: '12px', width: '130px' }}>
                        <option value="">Select user...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                      <button className="btn btn-secondary" style={{ height: '32px', padding: '0 8px', fontSize: '12px', borderRadius: '8px' }} type="submit">
                        Assign
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: 'var(--spacing-8)' }}>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-ghost"
            style={{ padding: '4px 8px' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-ghost"
            style={{ padding: '4px 8px' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
