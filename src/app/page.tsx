import { redirect } from 'next/navigation'
import { getUser } from '@/modules/auth/queries'

export default async function HomePage() {
  const user = await getUser()

  redirect(user ? '/dashboard' : '/sign-in')
}
