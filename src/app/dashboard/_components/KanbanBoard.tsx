'use client'

import { useState } from 'react'
import { TaskStatus } from '@/lib/enums'
import { updateTaskStatus } from '@/actions/kanbanActions'
import Link from 'next/link'
import { Calendar, AlertCircle, Plus, Search, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

const COLUMNS = [
  { id: TaskStatus.OPEN, title: 'Open', color: 'var(--on-surface-variant)' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'var(--info)' },
  { id: TaskStatus.PENDING_APPROVAL, title: 'In Review', color: 'var(--warning)' },
  { id: TaskStatus.COMPLETED, title: 'Done', color: 'var(--success)' },
]

export function KanbanBoard({ initialTasks, currentUser }: { initialTasks: any[], currentUser: any }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const router = useRouter()

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingId(taskId)
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== colId) {
      setDragOverCol(colId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverCol(null)
  }

  const handleDrop = async (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = e.dataTransfer.getData('text/plain')
    
    if (!taskId || taskId !== draggingId) return
    setDraggingId(null)

    const taskToMove = tasks.find(t => t.id === taskId)
    if (!taskToMove || taskToMove.status === colId) return

    // Optimistic UI update
    const previousTasks = [...tasks]
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: colId } : t))
    setError(null)

    // Call server action
    const result = await updateTaskStatus(taskId, colId)
    
    if (result.error) {
      // Revert on error
      setTasks(previousTasks)
      setError(result.error)
      setTimeout(() => setError(null), 3000)
    } else {
      router.refresh()
    }
  }
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    
    setIsAddingTask(true)
    try {
      const { quickCreateTask } = await import('@/actions/kanbanActions')
      const result = await quickCreateTask(newTaskTitle)
      if (result.error) {
        setError(result.error)
        setTimeout(() => setError(null), 3000)
      } else if (result.task) {
        setTasks([...tasks, { ...result.task, assignees: [currentUser], project: null }])
        setNewTaskTitle('')
      }
    } catch (err: any) {
      setError('Failed to create task')
    } finally {
      setIsAddingTask(false)
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'var(--danger)'
      case 'HIGH': return 'var(--warning)'
      case 'LOW': return 'var(--info)'
      default: return 'var(--primary)'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error && (
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="var(--on-surface-variant)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '36px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--on-surface-variant)" />
          <select 
            value={priorityFilter} 
            onChange={e => setPriorityFilter(e.target.value)}
            className="form-select"
            style={{ height: '36px', minWidth: '120px' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-16)', overflowX: 'auto', flex: 1, paddingBottom: '16px' }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => {
            if (t.status !== col.id) return false
            if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false
            if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
            return true
          })
          
          return (
            <div 
              key={col.id}
              style={{ 
                flex: '1', 
                minWidth: '280px', 
                backgroundColor: dragOverCol === col.id ? 'var(--surface)' : 'var(--surface-variant)', 
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'background-color 0.2s ease',
                border: dragOverCol === col.id ? `1px dashed ${col.color}` : '1px solid transparent',
              }}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: col.color, margin: 0 }}>{col.title}</h3>
                <span style={{ backgroundColor: 'var(--background)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                  {colTasks.length}
                </span>
              </div>

              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {col.id === TaskStatus.OPEN && (
                  <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Add a task..." 
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      className="form-input"
                      style={{ height: '32px', fontSize: '13px' }}
                      disabled={isAddingTask}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ padding: '0 8px', height: '32px' }} disabled={!newTaskTitle.trim() || isAddingTask}>
                      <Plus size={16} />
                    </button>
                  </form>
                )}
                {colTasks.map(task => (
                  <div 
                    key={task.id}
                    draggable={currentUser.role !== 'MEMBER'}
                    onDragStart={(e) => {
                      if (currentUser.role !== 'MEMBER') {
                        handleDragStart(e, task.id)
                      }
                    }}
                    style={{
                      backgroundColor: 'var(--background)',
                      padding: '16px',
                      borderRadius: '8px',
                      boxShadow: draggingId === task.id ? '0 8px 24px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                      border: '1px solid var(--border)',
                      cursor: currentUser.role !== 'MEMBER' ? 'grab' : 'default',
                      opacity: draggingId === task.id ? 0.5 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'box-shadow 0.2s, opacity 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}>
                          {task.priority}
                        </span>
                        {task.project && (
                          <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                            {task.project.title.substring(0, 15)}{task.project.title.length > 15 ? '...' : ''}
                          </span>
                        )}
                      </div>
                      
                      <Link href={`/dashboard?action=edit-task-${task.id}`} draggable={false} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)', textDecoration: 'none', display: 'block', lineHeight: 1.4 }} className="hover-underline">
                        {task.title}
                      </Link>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED ? 'var(--danger)' : 'var(--on-surface-variant)' }}>
                        <Calendar size={12} />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </div>
                      
                      {task.assignees && task.assignees.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }} title={`Assigned to ${task.assignees.map((a: any) => a.name).join(', ')}`}>
                          {task.assignees.map((assignee: any) => (
                            <div key={assignee.id}>
                              {assignee.avatarUrl ? (
                                <img src={assignee.avatarUrl} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} draggable={false} />
                              ) : (
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                  {assignee.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Unassigned">
                          <span style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>?</span>
                        </div>
                      )}
                    </div>

                    {task.status === TaskStatus.IN_PROGRESS && currentUser.role === 'MEMBER' && (
                      <Link 
                        href={`/dashboard?action=complete-task-${task.id}`}
                        className="btn btn-primary"
                        style={{ marginTop: '4px', padding: '6px 12px', fontSize: '12px', display: 'block', textAlign: 'center' }}
                      >
                        Complete Task
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
