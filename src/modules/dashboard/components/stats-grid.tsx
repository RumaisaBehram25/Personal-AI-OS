'use client'

import { ListTodo, CheckCircle2, Wallet, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsGridProps {
  isLoading?: boolean
}

export default function StatsGrid({ isLoading = false }: StatsGridProps) {
  const stats = [
    {
      title: 'Total Tasks',
      value: '12',
      label: '3 pending',
      icon: ListTodo,
      iconColor: 'text-[#6366f1]',
      iconBg: 'bg-[#6366f1]/10',
    },
    {
      title: 'Completed Today',
      value: '5',
      label: '83% completion rate',
      icon: CheckCircle2,
      iconColor: 'text-[#16a34a]',
      iconBg: 'bg-[#16a34a]/10',
    },
    {
      title: 'Money Spent Today',
      value: '$36.00',
      label: '$14.00 remaining budget',
      icon: Wallet,
      iconColor: 'text-[#d97706]',
      iconBg: 'bg-[#d97706]/10',
    },
    {
      title: 'Active Reminders',
      value: '4',
      label: 'Next in 2 hours',
      icon: Bell,
      iconColor: 'text-[#0891b2]',
      iconBg: 'bg-[#0891b2]/10',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-4 md:p-5 animate-pulse"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
            </div>
            <div className="h-7 w-12 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

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
