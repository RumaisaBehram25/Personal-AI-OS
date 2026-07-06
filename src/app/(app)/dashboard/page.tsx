'use client'

import { useState, useEffect } from 'react'
import { Plus, Sparkles, RefreshCw, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import AiSummaryCard from '@/modules/dashboard/components/ai-summary-card'
import QuickActions from '@/modules/dashboard/components/quick-actions'
import StatsGrid from '@/modules/dashboard/components/stats-grid'
import UpcomingTasks from '@/modules/dashboard/components/upcoming-tasks'
import RecentExpenses from '@/modules/dashboard/components/recent-expenses'
import UpcomingReminders from '@/modules/dashboard/components/upcoming-reminders'
import RecentNotes from '@/modules/dashboard/components/recent-notes'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Dynamic date formatting with fallback to prevent hydration mismatch
  const todayDateString = mounted
    ? new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Monday, July 6, 2026'

  // Trigger a temporary loading state
  const handleSimulateLoad = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f5f9]">
      {/* Top Bar - Frosted Glass Effect */}
      <header className="sticky top-0 z-30 bg-[#f1f5f9]/92 backdrop-blur-md border-b border-[#e2e8f0] px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 transition-all duration-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-[#64748b] font-medium mt-0.5">
            {todayDateString}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Simulate Loading State Button (dev only) */}
          {process.env.NODE_ENV !== 'production' && (
            <button
              onClick={handleSimulateLoad}
              disabled={isLoading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md bg-white border border-[#e2e8f0] px-3.5 py-2 text-sm font-semibold text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              title="Preview skeleton loading state"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#6366f1]' : ''}`} />
              <span>{isLoading ? 'Loading...' : 'Simulate Loading'}</span>
            </button>
          )}

          {/* New Chat Button */}
          <Link
            href="/chat"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4f46e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* 1. AI Daily Briefing (Hero - centerpiece) */}
        <section className="w-full">
          <AiSummaryCard isLoading={isLoading} />
        </section>

        {/* 2. Quick Actions Bar */}
        <section className="w-full">
          <QuickActions isLoading={isLoading} />
        </section>

        {/* 3. Stats Row */}
        <section className="w-full">
          <StatsGrid isLoading={isLoading} />
        </section>

        {/* 4. Middle Grid (Upcoming Tasks & Recent Expenses) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <UpcomingTasks isLoading={isLoading} />
          <RecentExpenses isLoading={isLoading} />
        </section>

        {/* 5. Bottom Grid (Upcoming Reminders & Recent Notes) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <UpcomingReminders isLoading={isLoading} />
          <RecentNotes isLoading={isLoading} />
        </section>
      </div>
    </div>
  )
}
