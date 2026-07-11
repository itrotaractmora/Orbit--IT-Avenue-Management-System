'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { SettingsForm } from './SettingsForm'
import { PasswordInput } from '@/components/PasswordInput'
import { PasswordChecker } from '@/components/PasswordChecker'
import { updatePasswordAction } from '@/actions/settingsActions'

export function PasswordSettingsSection() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordValid, setIsPasswordValid] = useState(false)

  return (
    <section className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-16)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={20} />
        </div>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Security</h2>
          <p className="body-text" style={{ fontSize: '13px', margin: 0 }}>Change your password.</p>
        </div>
      </div>
      
      <SettingsForm 
        action={updatePasswordAction} 
        submitLabel="Update Password" 
        disabled={password.length > 0 && !isPasswordValid}
      >
        <div className="form-group">
          <label className="form-label" htmlFor="password">New Password</label>
          <PasswordInput
            id="password"
            name="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <PasswordChecker
          password={password}
          confirmPassword={confirmPassword}
          onValidate={setIsPasswordValid}
        />
      </SettingsForm>
    </section>
  )
}
