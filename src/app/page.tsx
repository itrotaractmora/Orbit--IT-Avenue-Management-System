import { getSessionUser } from '@/actions/authActions'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const user = await getSessionUser()
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
