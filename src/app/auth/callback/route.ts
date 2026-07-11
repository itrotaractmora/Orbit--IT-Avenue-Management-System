import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  const handleRedirect = async (supabase: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    const isSelfSigned = user?.user_metadata?.self_signed === true

    let redirectUrl = next
    if (isSelfSigned) {
      await supabase.auth.signOut()
      redirectUrl = '/login?confirmed=true'
    } else {
      if (redirectUrl === '/') {
        redirectUrl = '/update-password'
      }
    }

    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
    } else {
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return handleRedirect(supabase)
    }
  } else if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      return handleRedirect(supabase)
    }
  }

  // If there's no code/token or an error occurred during exchange, redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
