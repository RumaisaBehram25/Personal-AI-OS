import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/constants'

const NAV = [
  { href: ROUTES.dashboard, label: 'Dashboard' },
  { href: ROUTES.chat, label: 'Chat' },
  { href: ROUTES.tasks, label: 'Tasks' },
  { href: ROUTES.expenses, label: 'Expenses' },
  { href: ROUTES.notes, label: 'Notes' },
  { href: ROUTES.reminders, label: 'Reminders' },
  { href: ROUTES.settings, label: 'Settings' },
]

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

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r p-4">
        <div className="mb-6 text-lg font-semibold">HypoOS</div>
        <nav className="flex flex-col gap-2 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
