import { ListTodo, CheckCircle2, Wallet, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'

interface StatsGridProps {
  pending: number
  completedToday: number
  total: number
  todaySpending: number
  weekSpending: number
  activeReminders: number
  currency: string
}

export default function StatsGrid({
  pending,
  completedToday,
  total,
  todaySpending,
  weekSpending,
  activeReminders,
  currency,
}: StatsGridProps) {
  const completionRate =
    total > 0 ? Math.round((completedToday / total) * 100) : 0

  const stats = [
    {
      title: 'Total Tasks',
      value: String(total),
      label: `${pending} pending`,
      icon: ListTodo,
      iconColor: 'text-[#6366f1]',
      iconBg: 'bg-[#6366f1]/10',
    },
    {
      title: 'Completed Today',
      value: String(completedToday),
      label: `${completionRate}% of all tasks`,
      icon: CheckCircle2,
      iconColor: 'text-[#16a34a]',
      iconBg: 'bg-[#16a34a]/10',
    },
    {
      title: 'Spent Today',
      value: formatMoney(todaySpending, currency),
      label: `${formatMoney(weekSpending, currency)} this week`,
      icon: Wallet,
      iconColor: 'text-[#d97706]',
      iconBg: 'bg-[#d97706]/10',
    },
    {
      title: 'Active Reminders',
      value: String(activeReminders),
      label: activeReminders > 0 ? 'upcoming' : 'none scheduled',
      icon: Bell,
      iconColor: 'text-[#0891b2]',
      iconBg: 'bg-[#0891b2]/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <div
            key={i}
            className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-4 md:p-5 transition-all duration-200 hover:shadow-md hover:border-[#6366f1]/30 hover:bg-[#6366f1]/[0.01]"
          >
            <div className="flex justify-between items-start mb-2.5">
              <span className="text-xs font-semibold text-[#64748b] tracking-wide uppercase">
                {stat.title}
              </span>
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg shadow-sm shrink-0',
                  stat.iconBg,
                )}
              >
                <Icon className={cn('h-4.5 w-4.5', stat.iconColor)} />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0f172a] mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-[#94a3b8] font-medium truncate">
              {stat.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
