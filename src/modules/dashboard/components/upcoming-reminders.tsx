'use client'

import { Bell, Mail, AppWindow, ChevronRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpcomingRemindersProps {
  isLoading?: boolean
}

const REMINDERS = [
  {
    id: 1,
    title: 'Doctor appointment',
    countdown: 'in 2 hours',
    channel: 'email',
  },
  {
    id: 2,
    title: 'Team sync meeting',
    countdown: 'in 4 hours',
    channel: 'in-app',
  },
  {
    id: 3,
    title: 'Pay internet bill',
    countdown: 'in 1 day',
    channel: 'email',
  },
]

export default function UpcomingReminders({ isLoading = false }: UpcomingRemindersProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return Mail
      case 'in-app':
      default:
        return AppWindow
    }
  }

  const getChannelStyles = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-50 text-[#0891b2] border-blue-100'
      case 'in-app':
      default:
        return 'bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full animate-pulse">
        <div className="flex justify-between items-center mb-5">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-[#fafbfc] border border-[#f1f5f9] rounded-md h-[54px]"
            >
              <div className="space-y-1.5">
                <div className="h-4.5 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
              <div className="h-5 w-14 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full transition-all duration-250 hover:shadow-md hover:border-[#6366f1]/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-[#6366f1]" />
          <span>Upcoming Reminders</span>
        </h3>
        <a
          href="/reminders"
          className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-2.5">
        {REMINDERS.map((reminder) => {
          const ChannelIcon = getChannelIcon(reminder.channel)
          return (
            <div
              key={reminder.id}
              className="group flex items-center justify-between p-3.5 bg-[#fafbfc] border border-[#f1f5f9] hover:border-[#6366f1]/20 hover:bg-[#6366f1]/[0.02] rounded-md transition-all duration-150"
            >
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#6366f1] transition-colors">
                  {reminder.title}
                </span>
                <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-[#d97706] font-semibold">
                  <Clock className="h-3 w-3" />
                  {reminder.countdown}
                </span>
              </div>
              <div className="shrink-0 ml-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wide',
                    getChannelStyles(reminder.channel),
                  )}
                >
                  <ChannelIcon className="h-2.5 w-2.5" />
                  <span>{reminder.channel}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
