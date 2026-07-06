'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Receipt,
  FileText,
  Bell,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/modules/auth/actions'

interface SidebarProps {
  user: {
    email?: string | null
    name?: string | null
    avatarUrl?: string | null
  }
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/reminders', label: 'Reminders', icon: Bell },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  // Get user display name and initials
  const displayName = user.name || user.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] h-screen sticky top-0 border-r border-[#e2e8f0] bg-white py-6 px-4 justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1] text-white shadow-sm shadow-[#6366f1]/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0f172a]">
              HypoOS
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-r-md transition-all duration-150 relative border-l-2',
                    isActive
                      ? 'border-[#6366f1] bg-[#6366f1]/[0.08] text-[#6366f1]'
                      : 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#fafbfc]',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] transition-colors',
                      isActive ? 'text-[#6366f1]' : 'text-[#475569]',
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User profile & Sign Out */}
        <div className="pt-4 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover border border-[#e2e8f0]"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6366f1]/10 text-[#6366f1] text-sm font-semibold border border-[#6366f1]/20">
                {initials}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-[#0f172a] truncate">
                {displayName}
              </span>
              <span className="text-xs text-[#94a3b8] truncate">
                {user.email}
              </span>
            </div>
          </div>
          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-[#e2e8f0] bg-white flex md:hidden items-center justify-around z-50 px-2 py-1 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors gap-1',
                isActive ? 'text-[#6366f1]' : 'text-[#64748b]',
              )}
            >
              <div
                className={cn(
                  'p-1 px-3 rounded-full transition-colors',
                  isActive ? 'bg-[#6366f1]/[0.08]' : '',
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-[#6366f1]' : 'text-[#475569]',
                  )}
                />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  )
}
