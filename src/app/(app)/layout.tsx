import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/constants'
import Sidebar from '@/components/shared/sidebar'
import { signOut } from '@/modules/auth/actions'
import { isAdmin } from '@/modules/admin/service'
import { getPrefs } from '@/modules/prefs/service'
import TimezoneSync from '@/modules/prefs/components/timezone-sync'

/**
 * Layout for the authenticated app. Server-side auth guard (in addition to the
 * middleware) plus the shared sidebar shell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(ROUTES.signIn)

  const [admin, prefs] = await Promise.all([
    isAdmin(supabase, user.id),
    getPrefs(supabase, user.id),
  ])

  // Construct user data to pass to the sidebar
  const userData = {
    email: user.email,
    name: user.user_metadata?.full_name || null,
    avatarUrl: user.user_metadata?.avatar_url || null,
  }

  // Get initials for mobile header avatar placeholder
  const displayName = userData.name || userData.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#f1f5f9]">
      <TimezoneSync
        serverTimezone={prefs.timezone}
        userSet={Boolean(prefs.preferences?.timezoneSetByUser)}
      />
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] px-4 h-14 flex items-center justify-between md:hidden shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#6366f1] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight text-[#0f172a] text-sm">
            HypoOS
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {userData.avatarUrl ? (
            <img
              src={userData.avatarUrl}
              alt={displayName}
              className="h-7 w-7 rounded-full object-cover border border-[#e2e8f0]"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6366f1]/10 text-[#6366f1] text-xs font-semibold border border-[#6366f1]/20">
              {initials}
            </div>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="flex h-7 w-7 items-center justify-center rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Shared Responsive Navigation (Sidebar / Bottom Nav) */}
      <Sidebar user={userData} isAdmin={admin} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
