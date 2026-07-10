import { getSessionUser, logoutAction } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, User, LogOut, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import { NavLink } from './_components/NavLink'
import { DarkModeToggle } from './_components/DarkModeToggle'
import { MobileNavToggle } from './_components/MobileNavToggle'
import { Toast } from './_components/Toast'

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
    <>
      <div className="mobile-overlay" />
      <div className="dashboard-layout">
        {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div style={{ marginBottom: 'var(--spacing-24)' }}>
            <Image
              src="/rotaract-logo.png"
              alt="Rotaract University of Moratuwa"
              width={180}
              height={60}
              style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: '60px' }}
              priority
            />
          </div>

          <div style={{
            padding: 'var(--spacing-12) var(--spacing-16)',
            marginBottom: 'var(--spacing-24)',
            borderRadius: 'var(--radius-input)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-12)'
          }}>
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-20)' }}>
            {/* Section: MAIN */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Main</div>
              <nav className="nav-group">
                <NavLink href="/dashboard" exact>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </NavLink>
              </nav>
            </div>

            {/* Section: SETTINGS */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Settings</div>
              <nav className="nav-group">
                <NavLink href={`/profile/${user.id}`}>
                  <User size={18} />
                  <span>Public Profile</span>
                </NavLink>
                <NavLink href={`/settings`}>
                  <Settings size={18} />
                  <span>Account Settings</span>
                </NavLink>
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
      <main style={{ flex: 1, backgroundColor: 'var(--background)', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--spacing-12) var(--spacing-24)', 
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-12)' }}>
            <MobileNavToggle />
            <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>IT Division</span>
          </div>
          <DarkModeToggle />
        </header>

        <div className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
      
      <Toast />
    </div>
    </>
  )
}
