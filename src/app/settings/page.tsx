import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import { updateProfileAction, updateEmailAction } from '@/actions/settingsActions'
import Link from 'next/link'
import { ArrowLeft, User as UserIcon, Mail, Shield, Settings, Image as ImageIcon } from 'lucide-react'
import { SettingsForm } from './_components/SettingsForm'
import { PasswordSettingsSection } from './_components/PasswordSettingsSection'

export default async function SettingsPage() {
  const sessionUser = await getSessionUser()
  
  if (!sessionUser) {
    redirect('/login')
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: 'var(--spacing-24)', paddingBottom: 'var(--spacing-32)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-16)', marginBottom: 'var(--spacing-32)' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ height: '36px', padding: '0 12px', fontSize: '14px', display: 'flex', gap: '8px' }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={24} color="var(--primary)" />
          Account Settings
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
        
        {/* Profile Section */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-16)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Public Profile</h2>
              <p className="body-text" style={{ fontSize: '13px', margin: 0 }}>Update your name and profile picture.</p>
            </div>
          </div>
          
          <SettingsForm action={updateProfileAction} submitLabel="Save Profile">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input className="form-input" type="text" id="name" name="name" defaultValue={sessionUser.name} required />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="avatarUrl">Profile Picture URL</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input 
                    className="form-input" 
                    type="url" 
                    id="avatarUrl" 
                    name="avatarUrl" 
                    defaultValue={sessionUser.avatarUrl || ''} 
                    placeholder="https://example.com/my-avatar.jpg" 
                  />
                  <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
                    Provide a public image URL (e.g., from Imgur, GitHub, or any public hosting).
                  </p>
                </div>
                {sessionUser.avatarUrl ? (
                  <img 
                    src={sessionUser.avatarUrl} 
                    alt="Current Avatar" 
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} 
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)', border: '2px dashed var(--border)' }}>
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>
            </div>
          </SettingsForm>
        </section>

        {/* Email Section */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-16)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={20} />
            </div>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Email Address</h2>
              <p className="body-text" style={{ fontSize: '13px', margin: 0 }}>Update the email address you use to sign in.</p>
            </div>
          </div>
          
          <SettingsForm action={updateEmailAction} submitLabel="Update Email" requireConfirmation="Are you sure you want to change your email address? You may be logged out or required to verify the new address.">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input className="form-input" type="email" id="email" name="email" defaultValue={sessionUser.email} required />
            </div>
          </SettingsForm>
        </section>

        {/* Password Section */}
        <PasswordSettingsSection />

      </div>
    </div>
  )
}
