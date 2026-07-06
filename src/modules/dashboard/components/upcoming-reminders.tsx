import Link from 'next/link'
import { Bell, Mail, AppWindow, ChevronRight, Clock } from 'lucide-react'
import { formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/modules/reminders/types'

function countdown(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ''
}

export default function UpcomingReminders({
  reminders,
}: {
  reminders: Reminder[]
}) {
  return (
    <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full transition-all duration-250 hover:shadow-md hover:border-[#6366f1]/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-[#6366f1]" />
          <span>Upcoming Reminders</span>
        </h3>
        <Link
          href="/reminders"
          className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {reminders.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#94a3b8]">
          No upcoming reminders.
        </p>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((reminder) => {
            const ChannelIcon = reminder.channel === 'email' ? Mail : AppWindow
            return (
              <div
                key={reminder.id}
                className="group flex items-center justify-between p-3.5 bg-[#fafbfc] border border-[#f1f5f9] hover:border-[#6366f1]/20 hover:bg-[#6366f1]/[0.02] rounded-md transition-all duration-150"
              >
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#6366f1] transition-colors">
                    {reminder.message}
                  </span>
                  <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-[#d97706] font-semibold">
                    <Clock className="h-3 w-3" />
                    {countdown(reminder.remind_at)}
                  </span>
                </div>
                <div className="shrink-0 ml-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wide',
                      reminder.channel === 'email'
                        ? 'bg-blue-50 text-[#0891b2] border-blue-100'
                        : 'bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20',
                    )}
                  >
                    <ChannelIcon className="h-2.5 w-2.5" />
                    <span>{reminder.channel === 'email' ? 'email' : 'in-app'}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
