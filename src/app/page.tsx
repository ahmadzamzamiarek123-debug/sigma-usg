import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, getRedirectPath } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (session?.user) {
    // Redirect to role-specific dashboard
    redirect(getRedirectPath(session.user.role))
  } else {
    // Redirect to login
    redirect('/login')
  }
}
