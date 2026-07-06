import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/modules/dashboard/service'
import { getPrefs } from '@/modules/prefs/service'
import AiSummaryCard from '@/modules/dashboard/components/ai-summary-card'
import QuickActions from '@/modules/dashboard/components/quick-actions'
import StatsGrid from '@/modules/dashboard/components/stats-grid'
import UpcomingTasks from '@/modules/dashboard/components/upcoming-tasks'
import RecentExpenses from '@/modules/dashboard/components/recent-expenses'
import UpcomingReminders from '@/modules/dashboard/components/upcoming-reminders'
import RecentNotes from '@/modules/dashboard/components/recent-notes'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [data, prefs] = await Promise.all([
    getDashboardData(supabase, user.id),
    getPrefs(supabase, user.id),
  ])

  let todayDateString = 'Today'
  try {
    todayDateString = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: prefs.timezone,
    }).format(new Date())
  } catch {
    todayDateString = new Date().toDateString()
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f5f9]">
      <header className="sticky top-0 z-30 bg-[#f1f5f9]/92 backdrop-blur-md border-b border-[#e2e8f0] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-[#64748b] font-medium mt-0.5">
            {todayDateString}
          </p>
        </div>

        <Link
          href="/chat"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4f46e5] transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Link>
      </header>

      <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <section className="w-full">
          <AiSummaryCard />
        </section>

        <section className="w-full">
          <QuickActions />
        </section>

        <section className="w-full">
          <StatsGrid
            pending={data.stats.pending}
            completedToday={data.stats.completedToday}
            total={data.stats.total}
            todaySpending={data.spending.todayTotal}
            weekSpending={data.spending.weekTotal}
            activeReminders={data.activeReminders}
            currency={data.currency}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <UpcomingTasks tasks={data.upcomingTasks} />
          <RecentExpenses expenses={data.recentExpenses} summary={data.spending} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <UpcomingReminders reminders={data.upcomingReminders} />
          <RecentNotes notes={data.recentNotes} />
        </section>
      </div>
    </div>
  )
}
