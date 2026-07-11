'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { signupAction, resendSignupOtpAction } from '@/actions/authActions'
import Image from 'next/image'
import { PasswordInput } from '@/components/PasswordInput'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function SignupProxyPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(signupAction, null)
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(true)

  // OTP confirmation states
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isOtpPending, setIsOtpPending] = useState(false)

  // Resend code states
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const email = sessionStorage.getItem('signup_allowed_email')
    if (!email || !email.endsWith('rotaractmora@gmail.com')) {
      router.push('/signup')
    } else {
      setVerifiedEmail(email)
      setIsVerifying(false)
    }
  }, [router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError(null)
    setResendSuccess(null)
    setIsOtpPending(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email: state?.email || verifiedEmail || '',
        token: otp.trim(),
        type: 'signup',
      })

      if (error) {
        setOtpError(error.message)
        setIsOtpPending(false)
      } else {
        // Sign out to clear the session so they must log in manually, matching the callback behavior
        await supabase.auth.signOut()
        sessionStorage.removeItem('signup_allowed_email')
        router.push('/login?confirmed=true')
      }
    } catch (err: any) {
      setOtpError(err.message || 'An error occurred during verification')
      setIsOtpPending(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return
    setIsResending(true)
    setOtpError(null)
    setResendSuccess(null)

    try {
      const password = (state as any)?.password || ''
      const result = await resendSignupOtpAction(state?.email || verifiedEmail || '', password)

      if (result?.error) {
        setOtpError(result.error)
        setIsResending(false)
      } else {
        setResendSuccess('Verification code resent successfully!')
        setResendCooldown(30)
        setIsResending(false)
      }
    } catch (err: any) {
      setOtpError(err.message || 'An error occurred while resending the code')
      setIsResending(false)
    }
  }

  if (isVerifying) {
    return (
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
          <p className="body-text" style={{ color: 'var(--on-surface-variant)' }}>Verifying access...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
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
        {state?.success ? (
          <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-16)'
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
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success, #10b981)',
              marginBottom: 'var(--spacing-8)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail-check"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /><path d="m16 19 2 2 4-4" /></svg>
            </div>
            <h3 className="card-title" style={{ margin: 0 }}>Verify Your Email</h3>
            <p className="body-text" style={{ fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: '1.6', margin: 0 }}>
              A confirmation email has been successfully sent to <strong style={{ color: 'var(--on-surface)' }}>{state.email}</strong>. Please check your inbox and enter the verification code below, or click the link in the email.
            </p>

            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)', width: '100%', marginTop: 'var(--spacing-8)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="otp" style={{ textAlign: 'center', display: 'block' }}>Verification Code</label>
                <input
                  className="form-input"
                  id="otp"
                  type="text"
                  maxLength={8}
                  required
                  placeholder="Enter code"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtp(val)
                  }}
                  disabled={isOtpPending}
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

              {resendSuccess && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--success, #10b981)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 'var(--radius-input, 8px)',
                  fontSize: '13px',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  {resendSuccess}
                </div>
              )}

              {otpError && (
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
                  {otpError}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                type="submit"
                disabled={isOtpPending || (otp.length !== 6 && otp.length !== 8)}
              >
                {isOtpPending ? (
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
                ) : 'Confirm Code'}
              </button>

              <button
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isResending}
              >
                {isResending ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    Sending Code...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend Code in ${resendCooldown}s`
                ) : 'Resend Code'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-8)', fontSize: '13px' }}>
              <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
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
                <p className="body-text" style={{ fontSize: '13px', marginTop: '2px', textAlign: 'center' }}>IT Division — Create a new account</p>
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
                  placeholder="John Doe"
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
                  value={verifiedEmail || ''}
                  readOnly
                  style={{ backgroundColor: 'var(--surface-variant)', cursor: 'not-allowed', opacity: 0.8 }}
                  placeholder="name@itavenue.com"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role">Workspace Role</label>
                <select className="form-select" id="role" name="role" required>
                  <option value="">Select a role</option>
                  <option value="PRESIDENT">President</option>
                  <option value="SENIOR_DIRECTOR">Senior Director</option>
                  <option value="CO_DIRECTOR">Co-Director</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
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
          </>
        )}
      </div>
    </div>
  )
}
