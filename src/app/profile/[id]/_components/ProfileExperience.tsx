'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BadgeCheck, Briefcase, Camera, Copy, FileDown, Mail, Sparkles, Workflow, Lock, ShieldCheck, CircleDashed, Loader2, Check, AlertCircle, Upload } from 'lucide-react'
import { TaskStatus, UserRole } from '@prisma/client'
import { updateProfileAction, updateTaskStatusAction } from '@/actions/userActions'

type ProfileUser = {
  id: string
  name: string
  avatarUrl: string | null
  headline: string | null
  bio: string | null
  location: string | null
  skills: string[]
  email: string
  role: UserRole
  team: { name: string | null } | null
  isPublicProfile: boolean
  isVerified: boolean
  assignedTasks: Array<{
    id: string
    title: string
    description: string | null
    status: TaskStatus
    updatedAt: string | Date
    project: { title: string | null } | null
    creator: { name: string; avatarUrl: string | null; role: UserRole } | null
    assigner: { name: string; avatarUrl: string | null; role: UserRole } | null
    assignees: Array<{ name: string; avatarUrl: string | null; role: UserRole }>
  }>
}

type SessionUser = {
  id: string
  name: string
  role: UserRole
}

type Stats = {
  completedTasks: Array<unknown>
  inFlightTasks: Array<unknown>
  assignedTasks: Array<unknown>
  approvalRate: number
}

type Props = {
  profileUser: ProfileUser
  sessionUser: SessionUser
  isOwner: boolean
  canViewInternal: boolean
  siteUrl: string
  stats: Stats
}

const labelForRole = (role: UserRole) => role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
const roleBadgeTone = (role: UserRole) => {
  switch (role) {
    case UserRole.PRESIDENT:
      return 'chip chip-danger'
    case UserRole.SENIOR_DIRECTOR:
      return 'chip chip-warning'
    case UserRole.CO_DIRECTOR:
      return 'chip chip-info'
    case UserRole.TEAM_LEAD:
      return 'chip chip-success'
    default:
      return 'chip chip-neutral'
  }
}

const taskColumn = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.OPEN:
      return 'Assigned'
    case TaskStatus.IN_PROGRESS:
      return 'In Progress'
    case TaskStatus.PENDING_APPROVAL:
      return 'Pending Approval'
    case TaskStatus.COMPLETED:
      return 'Completed'
    default:
      return 'Assigned'
  }
}

export function ProfileExperience({ profileUser, isOwner, canViewInternal, siteUrl, stats }: Props) {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPublic, setIsPublic] = useState(profileUser.isPublicProfile)
  const [avatarUrl, setAvatarUrl] = useState(profileUser.avatarUrl)
  const [avatarState, setAvatarState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [tasks, setTasks] = useState(profileUser.assignedTasks)
  const [showInternal, setShowInternal] = useState(canViewInternal || !profileUser.isPublicProfile)

  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(null), 2400)
      return () => window.clearTimeout(timer)
    }
  }, [toast])

  const completionScore = useMemo(() => {
    const base = 45
    const extras = [profileUser.avatarUrl ? 15 : 0, profileUser.bio ? 15 : 0, profileUser.headline ? 10 : 0, profileUser.skills.length ? 15 : 0]
    return Math.min(100, base + extras.reduce((sum, value) => sum + value, 0))
  }, [profileUser])

  const handleToggleVisibility = async () => {
    const next = !isPublic
    try {
      const result = await updateProfileAction({ isPublicProfile: next })
      if (result?.error) {
        throw new Error(result.error)
      }
      setIsPublic(next)
      setShowInternal(next || canViewInternal)
      setToast({ type: 'success', message: next ? 'Profile published' : 'Profile hidden' })
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Unable to change visibility.' })
    }
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarState('error')
      setToast({ type: 'error', message: 'Upload a JPG, PNG, or WebP image.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarState('error')
      setToast({ type: 'error', message: 'Images must be 2MB or smaller.' })
      return
    }

    setAvatarState('loading')
    try {
      const result = await updateProfileAction({ avatar: file })
      if (result?.error) {
        throw new Error(result.error)
      }
      setAvatarUrl(result?.avatarUrl || null)
      setAvatarState('success')
      setToast({ type: 'success', message: 'Avatar updated' })
    } catch (error) {
      setAvatarState('error')
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Avatar upload failed.' })
    }
  }

  const handleTaskStatus = async (taskId: string, nextStatus: TaskStatus) => {
    const previous = tasks.find((task) => task.id === taskId)
    setStatusUpdating(taskId)
    const optimistic = tasks.map((task) => task.id === taskId ? { ...task, status: nextStatus } : task)
    setTasks(optimistic)
    try {
      const result = await updateTaskStatusAction(taskId, nextStatus)
      if (result?.error) {
        throw new Error(result.error)
      }
      setToast({ type: 'success', message: `Task marked ${nextStatus === TaskStatus.COMPLETED ? 'Completed' : 'In Progress'}` })
    } catch (error) {
      if (previous) {
        setTasks(tasks.map((task) => task.id === taskId ? previous : task))
      }
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'Task update failed.' })
    } finally {
      setStatusUpdating(null)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/profile/${profileUser.id}`)
      setToast({ type: 'success', message: 'Profile link copied' })
    } catch {
      setToast({ type: 'error', message: 'Clipboard access unavailable.' })
    }
  }

  const isPublicExternal = isPublic && !canViewInternal && !isOwner
  const visibleTasks = tasks.filter((task) => {
    if (isPublicExternal) {
      return task.status === TaskStatus.COMPLETED
    }
    return true
  })

  return (
    <div className="profile-shell" style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(247,168,27,0.18), transparent 18%), linear-gradient(135deg, rgba(206,10,109,0.08), rgba(0,103,200,0.08))' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.14, backgroundImage: 'linear-gradient(90deg, transparent 0 6px, rgba(143,8,80,0.6) 6px 8px, transparent 8px 14px), linear-gradient(0deg, transparent 0 6px, rgba(143,8,80,0.6) 6px 8px, transparent 8px 14px)', backgroundSize: '16px 16px' }} />
        <div style={{ position: 'relative', padding: '24px' }}>
          <div className="flex between" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-secondary" style={{ display: 'flex', gap: '8px', height: '40px', padding: '0 12px' }}>
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {isOwner && (
                <label className="btn btn-secondary" style={{ display: 'inline-flex', gap: '8px', cursor: 'pointer' }}>
                  <Upload size={16} />
                  <span>Upload photo</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              )}
              <button className="btn btn-secondary" onClick={copyLink}>
                <Copy size={16} />
                <span>Copy CV link</span>
              </button>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <FileDown size={16} />
                <span>Download as PDF</span>
              </button>
              {isOwner && (
                <button className="btn btn-primary" onClick={handleToggleVisibility}>
                  {isPublic ? <Lock size={16} /> : <ShieldCheck size={16} />}
                  <span>{isPublic ? 'Hide public view' : 'Publish profile'}</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1.3fr 0.7fr', alignItems: 'start', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '104px', height: '104px', borderRadius: '999px', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.8)', boxShadow: '0 18px 40px rgba(0,0,0,0.18)' }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={profileUser.name} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--info))', color: 'white', fontSize: '34px', fontWeight: 700 }}>
                    {profileUser.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                {isOwner && (
                  <label style={{ position: 'absolute', right: '4px', bottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '999px', background: 'var(--surface)', boxShadow: 'var(--shadow-card)', cursor: 'pointer' }}>
                    <Camera size={16} color="var(--primary)" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <h1 className="page-title-text" style={{ fontSize: '32px', margin: 0 }}>{profileUser.name}</h1>
                  {profileUser.isVerified && <span className="chip chip-warning"><BadgeCheck size={12} /> Verified</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {!isPublicExternal && <span className={roleBadgeTone(profileUser.role)}>{labelForRole(profileUser.role)}</span>}
                  {!isPublicExternal && <span className="chip chip-neutral">{profileUser.team?.name || 'Rotaract Member'}</span>}
                  {profileUser.isPublicProfile && <span className="chip chip-success">Public view enabled</span>}
                  {isPublicExternal && <span className="chip chip-info">Verified contributor</span>}
                </div>
                <p className="body-text" style={{ marginTop: '12px', fontSize: '16px' }}>{profileUser.headline || 'Building dependable digital experiences for the Rotaract IT Division.'}</p>
                <div className="body-text" style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
                  {!isPublicExternal && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Mail size={14} />{profileUser.email}</span>}
                  {profileUser.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Briefcase size={14} />{profileUser.location}</span>}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(8px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div className="label-caps">Profile completeness</div>
                  <div className="stat-value" style={{ fontSize: '28px' }}>{completionScore}%</div>
                </div>
                <Sparkles color="var(--primary)" />
              </div>
              <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(206,10,109,0.12)', overflow: 'hidden' }}>
                <div style={{ width: `${completionScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--gold))', borderRadius: '999px' }} />
              </div>
              <p className="body-text" style={{ marginTop: '12px', fontSize: '13px' }}>Add a headline, bio, and skills to strengthen your professional profile.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-dashboard">
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="flex between" style={{ alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '4px' }}>About</h2>
                <p className="body-text">Core professional essentials, kept concise and trustworthy.</p>
              </div>
              <span className="chip chip-info">Rotaract-branded</span>
            </div>
            <p className="body-text" style={{ fontSize: '15px', lineHeight: 1.7 }}>{profileUser.bio || 'A passionate contributor in the Rotaract IT Division, focused on dependable delivery, systems thinking, and strong collaboration.'}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
              {profileUser.skills.length > 0 ? profileUser.skills.map((skill) => <span key={skill} className="chip chip-neutral">{skill}</span>) : <span className="body-text">No skills added yet. Add a few technologies to show your strengths.</span>}
            </div>
          </div>

          <div className="card">
            <div className="flex between" style={{ alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '4px' }}>Workload matrix</h2>
                <p className="body-text">Assignments from your Director or Co-Director appear here instantly.</p>
              </div>
              <span className="chip chip-success">Live updates</span>
            </div>
            {isPublicExternal ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="empty-state" style={{ padding: '16px', minHeight: 'auto', marginBottom: '8px' }}>
                  <ShieldCheck size={18} />
                  <p className="empty-state-description">Public view shows completed work and verified skills only. Internal task details remain private.</p>
                </div>
                {visibleTasks.length === 0 ? (
                  <p className="body-text" style={{ textAlign: 'center', fontStyle: 'italic' }}>No completed tasks to display yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {visibleTasks.map((task) => (
                      <div key={task.id} className="card" style={{ padding: '16px', border: '1px solid var(--border)' }}>
                        <strong style={{ fontSize: '15px', display: 'block', marginBottom: '8px' }}>{task.title}</strong>
                        <div className="body-text" style={{ fontSize: '13px', marginBottom: '8px' }}>{task.project?.title || 'General task'}</div>
                        <span className="chip chip-success" style={{ fontSize: '11px', padding: '2px 6px' }}>Completed</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid-dashboard" style={{ gap: '12px' }}>
                {(['Assigned', 'In Progress', 'Completed'] as const).map((column) => {
                  const columnTasks = visibleTasks.filter((task) => taskColumn(task.status) === column)
                  return (
                    <div key={column} className="col-4" style={{ minWidth: 0 }}>
                      <div className="card" style={{ padding: '16px', height: '100%' }}>
                        <div className="flex between" style={{ alignItems: 'center', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0 }}>{column}</h3>
                          <span className="chip chip-neutral">{columnTasks.length}</span>
                        </div>
                        {columnTasks.length === 0 ? (
                          <div className="empty-state" style={{ padding: '16px', minHeight: '120px' }}>
                            <CircleDashed size={18} />
                            <p className="empty-state-description">No active tasks yet — new assignments from your Director will appear here.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {columnTasks.map((task) => (
                              <div key={task.id} className="card" style={{ padding: '12px', boxShadow: 'none', border: '1px solid var(--border)' }}>
                                <div className="flex between" style={{ alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <strong style={{ fontSize: '14px' }}>{task.title}</strong>
                                  {isOwner && task.status !== TaskStatus.COMPLETED && (
                                    <button className="btn btn-secondary" style={{ height: '32px', padding: '0 10px', fontSize: '12px' }} onClick={() => handleTaskStatus(task.id, task.status === TaskStatus.OPEN ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED)}>
                                      {statusUpdating === task.id ? <Loader2 size={14} className="spinning" /> : task.status === TaskStatus.OPEN ? 'Start' : 'Complete'}
                                    </button>
                                  )}
                                </div>
                                <div className="body-text" style={{ fontSize: '13px', marginBottom: '8px' }}>{task.project?.title || 'General task'}</div>
                                {task.assigner && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '999px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{task.assigner.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
                                    <span>{task.assigner.name} · {labelForRole(task.assigner.role)}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '12px' }}>Quick actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-primary" onClick={copyLink}><Copy size={16} /> Copy CV link</button>
              {isOwner && (
                <button className="btn btn-secondary" onClick={handleToggleVisibility}>{isPublic ? <Lock size={16} /> : <ShieldCheck size={16} />} {isPublic ? 'Hide public view' : 'Publish profile'}</button>
              )}
              {canViewInternal && (
                <button className="btn btn-secondary" onClick={() => setShowInternal((value) => !value)}><Workflow size={16} /> {showInternal ? 'Hide internal data' : 'Show internal view'}</button>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '12px' }}>Verified credentials</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="chip chip-success" style={{ width: 'fit-content' }}><BadgeCheck size={13} /> Verified email</div>
              <div className="chip chip-warning" style={{ width: 'fit-content' }}><Sparkles size={13} /> Admin-verified skills</div>
              <div className="chip chip-info" style={{ width: 'fit-content' }}><ShieldCheck size={13} /> Secure publication</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '12px' }}>Highlights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="body-text">Completed tasks</span><strong>{stats.completedTasks.length}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="body-text">In flight</span><strong>{stats.inFlightTasks.length}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="body-text">Approval rate</span><strong>{stats.approvalRate}%</strong></div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', right: '16px', bottom: '16px', zIndex: 1000 }} className={`chip ${toast.type === 'success' ? 'chip-success' : 'chip-danger'}`}>
          {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />} {toast.message}
        </div>
      )}
    </div>
  )
}
