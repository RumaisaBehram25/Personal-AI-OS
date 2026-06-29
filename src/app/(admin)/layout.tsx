import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/constants'

/**
 * Admin-only layout. Requires a signed-in user whose `users.role` is 'admin';
 * everyone else is redirected to the dashboard.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(ROUTES.signIn)

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(ROUTES.dashboard)

  return <div className="min-h-screen p-6">{children}</div>
}
