import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/constants'

/** Landing route: send signed-in users to the dashboard, others to sign-in. */
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  redirect(user ? ROUTES.dashboard : ROUTES.signIn)
}
