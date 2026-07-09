'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signupAction } from '@/actions/authActions'
import { Zap } from 'lucide-react'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null)

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
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(83, 0, 183, 0.05)',
            color: 'var(--primary)'
          }}>
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="card-title" style={{ fontSize: '20px', fontWeight: 700 }}>Join IT Avenue</h2>
            <p className="body-text" style={{ fontSize: '13px', marginTop: '2px' }}>Register your workspace profile</p>
          </div>
        </div>

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              className="form-input"
              id="name"
              name="name"
              type="text"
              required
              placeholder="Alex Johnson"
              autoComplete="name"
            />
          </div>

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
            <input
              className="form-input"
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="new-password"
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
            {isPending ? 'Registering...' : 'Register Profile'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-24)', fontSize: '13px' }}>
          <span style={{ color: 'var(--on-surface-variant)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
