'use client'

import { useActionState } from 'react'
import { updatePasswordAction } from '@/actions/authActions'
import { PasswordInput } from '@/components/PasswordInput'

const initialState = {
  error: null as string | null
}

export default function UpdatePasswordPage() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState)

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-32)' }}>
          <h1 className="section-title">Set Password</h1>
          <p className="body-text" style={{ color: 'var(--on-surface-variant)', marginTop: 'var(--spacing-8)' }}>
            Please set a new permanent password for your account.
          </p>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          {state?.error && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>
              {state.error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--on-surface)' }}>New Password</label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={6}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="confirmPassword" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--on-surface)' }}>Confirm Password</label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--spacing-8)', height: '48px', fontSize: '16px' }}
          >
            {pending ? 'Saving...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
