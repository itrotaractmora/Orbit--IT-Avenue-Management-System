'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing your invitation...')

  useEffect(() => {
    const supabase = createClient()

    // The hash fragment contains the access_token from Supabase invite links
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const error = hashParams.get('error')
    const errorDescription = hashParams.get('error_description')

    if (error) {
      setStatus(`Error: ${errorDescription || error}`)
      setTimeout(() => router.push('/login'), 3000)
      return
    }

    if (accessToken && refreshToken) {
      // Set the session using the tokens from the hash
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error: sessionError }) => {
        if (sessionError) {
          setStatus(`Session error: ${sessionError.message}`)
          setTimeout(() => router.push('/login'), 3000)
        } else {
          setStatus('Success! Redirecting to set your password...')
          router.push('/update-password')
        }
      })
    } else {
      // No tokens in hash - check if there's a code in query params (PKCE flow)
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      if (code) {
        // Exchange code for session via the server-side callback
        fetch(`/auth/callback?code=${code}&next=/update-password`, { redirect: 'follow' })
          .then(() => router.push('/update-password'))
          .catch(() => {
            setStatus('Failed to process auth code.')
            setTimeout(() => router.push('/login'), 3000)
          })
      } else {
        setStatus('No authentication data found. Redirecting...')
        setTimeout(() => router.push('/login'), 2000)
      }
    }
  }, [router])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
    }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--primary)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p className="body-text">{status}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
