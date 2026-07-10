'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/actions/authActions'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

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
            <p className="body-text" style={{ fontSize: '13px', marginTop: '2px', textAlign: 'center' }}>IT Division — Sign in to your account</p>
          </div>
        </div>

        {authError && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            borderRadius: '8px',
            fontSize: '13px',
            textAlign: 'center',
            marginBottom: 'var(--spacing-16)',
          }}>
            {decodeURIComponent(authError)}
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
            <input
              className="form-input"
              id="password"
              name="password"
              type="password"
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

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-24)', fontSize: '13px' }}>
          <span style={{ color: 'var(--on-surface-variant)' }}>Don't have an account? </span>
          <Link href="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}
