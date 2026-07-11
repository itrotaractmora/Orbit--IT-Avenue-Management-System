'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupGatePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    // Wait a brief moment for transition UX/micro-animation
    setTimeout(() => {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        setError('Email address is required')
        setIsPending(false)
        return
      }

      if (!trimmedEmail.endsWith('rotaractmora@gmail.com')) {
        setError('Registration is restricted. Invalid email address.')
        setIsPending(false)
        return
      }

      // Store in session storage
      sessionStorage.setItem('signup_allowed_email', trimmedEmail)
      
      // Proceed to the registration proxy page
      router.push('/signup/prxy')
    }, 600)
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
            <h3 className="card-title" style={{ margin: '0 0 4px 0', fontSize: '20px' }}>Join IT Avenue</h3>
            <p className="body-text" style={{ fontSize: '13px', marginTop: '2px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              Enter your invitation email to access signup
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="gate-email">Email address</label>
            <input
              className="form-input"
              id="gate-email"
              type="email"
              required
              placeholder="name.rotaractmora@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              style={{
                transition: 'border-color 0.2s, box-shadow 0.2s',
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
              transition: 'all 0.2s ease-in-out',
            }}
            type="submit"
            disabled={isPending}
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
            ) : 'Verify & Proceed'}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-24)', fontSize: '13px' }}>
          <Link href="/login" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontWeight: 500 }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
