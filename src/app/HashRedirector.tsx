'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function HashRedirector({ fallbackPath = '/login' }: { fallbackPath?: string }) {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash

    if (hash && hash.includes('access_token')) {
      // Supabase link with tokens in hash fragment
      const supabase = createClient()
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')!
      const refreshToken = hashParams.get('refresh_token')!
      const type = hashParams.get('type')

      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to set session from hash:', error.message)
          router.replace(fallbackPath)
        } else {
          supabase.auth.getUser().then(({ data: { user } }) => {
            const isSelfSigned = user?.user_metadata?.self_signed === true || type === 'signup'
            if (isSelfSigned) {
              supabase.auth.signOut().then(() => {
                router.replace('/login?confirmed=true')
              })
            } else {
              // Session set! Redirect to set password page
              router.replace('/update-password')
            }
          })
        }
      })
    } else if (hash && hash.includes('error=')) {
      // Supabase returned an error (e.g. user_banned, expired link)
      const hashParams = new URLSearchParams(hash.substring(1))
      const errorDesc = hashParams.get('error_description') || hashParams.get('error') || 'Unknown error'
      console.error('Auth error from Supabase:', errorDesc)
      router.replace(`${fallbackPath}?error=${encodeURIComponent(errorDesc)}`)
    } else {
      // No hash fragment — just redirect to fallback
      router.replace(fallbackPath)
    }
  }, [router, fallbackPath])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
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
  )
}
