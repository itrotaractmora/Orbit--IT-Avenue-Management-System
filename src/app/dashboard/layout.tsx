import { getSessionUser, logoutAction } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, User, LogOut, Zap } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand" style={{ marginBottom: 'var(--spacing-32)' }}>
            <Zap size={18} strokeWidth={2.5} />
            <span>IT Avenue</span>
          </div>

          <div style={{
            padding: 'var(--spacing-12) var(--spacing-16)',
            marginBottom: 'var(--spacing-24)',
            borderRadius: 'var(--radius-input)',
            backgroundColor: '#fafafa',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>{user.name}</div>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '4px'
            }}>
              {user.role.replace('_', ' ')}
            </div>
            {user.team && (
              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                {user.team.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>
            {/* Section: MAIN */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Main</div>
              <nav className="nav-group">
                <Link href="/dashboard" className="nav-link active">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              </nav>
            </div>

            {/* Section: SETTINGS */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Settings</div>
              <nav className="nav-group">
                <Link href={`/profile/${user.id}`} className="nav-link">
                  <User size={18} />
                  <span>Public Profile</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <form action={logoutAction} style={{ marginTop: 'auto' }}>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', gap: 'var(--spacing-12)' }} type="submit">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </form>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  )
}
