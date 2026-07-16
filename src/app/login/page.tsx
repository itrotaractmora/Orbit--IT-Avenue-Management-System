'use client'

import { useActionState, Suspense } from 'react'
import Link from 'next/link'
import { loginAction } from '@/actions/authActions'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { PasswordInput } from '@/components/PasswordInput'

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
  const isConfirmed = searchParams.get('confirmed') === 'true'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      padding: 'var(--spacing-16)'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: 'var(--spacing-32)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-32)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-8)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 'var(--spacing-8)'
          }}>
            <Image
              src="/rotaract-logo.png"
              alt="Rotaract University of Moratuwa"
              width={220}
              height={72}
              style={{ objectFit: 'contain', width: '220px', height: 'auto' }}
              priority
            />
          </div>
          <div>
            <p className="body-text" style={{ fontSize: '13px', marginTop: '2px', textAlign: 'center' }}>Orbit — Sign in to your account</p>
          </div>
        </div>

        {isConfirmed && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--success, #10b981)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: 'var(--spacing-16)'
          }}>
            Email verified successfully! You can now log in.
          </div>
        )}

        {authError && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: 'var(--spacing-16)'
          }}>
            {authError === 'otp_expired' ? 'Your email link has expired. Please sign in again.' : 'Authentication failed.'}
          </div>
        )}

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              className="form-input"
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@itavenue.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              name="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {state?.error && (
            <div className="chip chip-danger" style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              textTransform: 'none',
              padding: 'var(--spacing-8) var(--spacing-12)',
              borderRadius: 'var(--radius-input)',
              fontSize: '13px',
              fontWeight: 500
            }}>
              {state.error}
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--spacing-8)' }}
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>


      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p className="body-text" style={{ color: 'var(--on-surface-variant)' }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
