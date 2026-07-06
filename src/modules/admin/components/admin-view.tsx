import {
  Users,
  ListTodo,
  Receipt,
  MessageSquare,
  Wrench,
  MessagesSquare,
  ShieldCheck,
} from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { formatMoney } from '@/lib/format'
import type { PlatformMetrics } from '../service'

function formatDate(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? format(d, 'MMM d, yyyy') : ''
}

export default function AdminView({ metrics }: { metrics: PlatformMetrics }) {
  const cards = [
    {
      title: 'Registered Users',
      value: String(metrics.totalUsers),
      icon: Users,
      color: 'text-[#6366f1]',
      bg: 'bg-[#6366f1]/10',
    },
    {
      title: 'Total Tasks',
      value: String(metrics.totalTasks),
      sub: `${metrics.completedTasks} completed`,
      icon: ListTodo,
      color: 'text-[#16a34a]',
      bg: 'bg-[#16a34a]/10',
    },
    {
      title: 'Expenses Logged',
      value: String(metrics.totalExpenses),
      sub: `${formatMoney(metrics.expenseAmount)} total`,
      icon: Receipt,
      color: 'text-[#d97706]',
      bg: 'bg-[#d97706]/10',
    },
    {
      title: 'Conversations',
      value: String(metrics.totalConversations),
      icon: MessagesSquare,
      color: 'text-[#0891b2]',
      bg: 'bg-[#0891b2]/10',
    },
    {
      title: 'Messages',
      value: String(metrics.totalMessages),
      icon: MessageSquare,
      color: 'text-[#7c3aed]',
      bg: 'bg-[#7c3aed]/10',
    },
    {
      title: 'AI Tool Calls',
      value: String(metrics.toolCalls),
      icon: Wrench,
      color: 'text-[#db2777]',
      bg: 'bg-[#db2777]/10',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[#f1f5f9]/92 px-4 py-4 backdrop-blur-md md:px-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0f172a]">
          <ShieldCheck className="h-5 w-5 text-[#6366f1]" />
          Admin
        </h1>
        <p className="text-xs text-[#64748b] md:text-sm">
          Platform-wide activity across all users
        </p>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.title}
                className="rounded-lg border border-[#e9eef5] bg-white p-4 shadow-sm md:p-5"
              >
                <div className="mb-2.5 flex items-start justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    {c.title}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-[#0f172a]">
                  {c.value}
                </div>
                {c.sub && (
                  <div className="mt-1 truncate text-xs font-medium text-[#94a3b8]">
                    {c.sub}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-lg border border-[#e9eef5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-[#0f172a]">Recent signups</h2>
          {metrics.recentUsers.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No users yet.</p>
          ) : (
            <div className="divide-y divide-[#eef2f7]">
              {metrics.recentUsers.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#0f172a]">
                      {u.full_name || 'Unnamed'}
                    </p>
                    <p className="truncate text-xs text-[#94a3b8]">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[#94a3b8]">
                    {formatDate(u.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
