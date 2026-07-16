'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { verifyInviteCode } from '@/actions/userActions'

export default function JoinPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      const result = await verifyInviteCode(email, code)

      if (result.error) {
        setError(result.error)
        setIsPending(false)
        return
      }

      if (result.tokenHash) {
        // Redirect to auth callback with the token hash to complete Supabase verification
        router.push(`/auth/callback?token_hash=${result.tokenHash}&type=invite&next=/update-password`)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setIsPending(false)
    }
  }

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
            <h3 className="card-title" style={{ margin: '0 0 4px 0', fontSize: '20px' }}>Accept Invitation</h3>
            <p className="body-text" style={{ fontSize: '13px', marginTop: '2px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              Enter your email and the 6-digit code from your invitation email
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="join-email">Email address</label>
            <input
              className="form-input"
              id="join-email"
              type="email"
              required
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="join-code">Invitation Code</label>
            <input
              className="form-input"
              id="join-code"
              type="text"
              maxLength={6}
              required
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setCode(val)
              }}
              disabled={isPending}
              style={{
                letterSpacing: '8px',
                textIndent: '8px',
                textAlign: 'center',
                fontSize: '20px',
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            />
          </div>

          {error && (
            <div className="chip chip-danger" style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              textTransform: 'none',
              padding: 'var(--spacing-8) var(--spacing-12)',
              borderRadius: 'var(--radius-input)',
              fontSize: '13px',
              fontWeight: 500,
              animation: 'shake 0.3s'
            }}>
              {error}
              <style>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  25% { transform: translateX(-4px); }
                  75% { transform: translateX(4px); }
                }
              `}</style>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: 'var(--spacing-8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            type="submit"
            disabled={isPending || code.length !== 6}
          >
            {isPending ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid currentColor',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Verifying...
              </>
            ) : 'Accept Invitation'}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
