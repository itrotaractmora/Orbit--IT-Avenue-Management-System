import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'
import { HashRedirector } from './HashRedirector'

export default async function HomePage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Handle PKCE flow: if Supabase sends a ?code= query param
  const searchParams = await props.searchParams
  const code = searchParams?.code
  if (code && typeof code === 'string') {
    redirect(`/auth/callback?code=${code}&next=/update-password`)
  }

  const user = await getSessionUser()
  if (user) {
    redirect('/dashboard')
  }

  // IMPORTANT: Do NOT redirect to /login here on the server.
  // Supabase invite links redirect here with a #access_token hash fragment.
  // Hash fragments are invisible to the server, so we must render a client
  // component (HashRedirector) first to check for them.
  // If no hash is found, HashRedirector redirects to /login client-side.
  return <HashRedirector fallbackPath="/login" />
}
