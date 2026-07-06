'use client'

import { Sparkles, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface AiSummaryCardProps {
  isLoading?: boolean
}

export default function AiSummaryCard({ isLoading = false }: AiSummaryCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  if (isLoading || isRefreshing) {
    return (
      <div className="w-full bg-white rounded-lg border border-[#e9eef5] shadow-md p-6 md:p-7 border-l-4 border-l-[#6366f1] animate-pulse">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-200" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-3.5 w-24 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="h-9 w-32 bg-slate-200 rounded-md" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-4 w-[96%] bg-slate-200 rounded" />
          <div className="h-4 w-[98%] bg-slate-200 rounded" />
          <div className="h-4 w-[75%] bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg border border-[#e9eef5] shadow-md p-6 md:p-7 border-l-4 border-l-[#6366f1] bg-gradient-to-r from-[#6366f1]/[0.07] to-[#0891b2]/[0.07] relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-l-[#4f46e5]">
      {/* Decorative background grid pattern for visual elegance */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0891b2]/10 text-[#0891b2] shadow-sm shadow-[#0891b2]/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
              AI Daily Briefing
              <span className="inline-flex items-center rounded-full bg-[#6366f1]/10 px-2 py-0.5 text-xs font-semibold text-[#6366f1]">
                Live
              </span>
            </h2>
            <p className="text-xs text-[#64748b]">HypoOS intelligence engine active</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4f46e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366f1] transition-all duration-150 active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Summary</span>
        </button>
      </div>

      <div className="relative z-10 text-[#0f172a] leading-relaxed text-sm md:text-base space-y-3 font-medium">
        <p className="text-slate-800">
          Good morning! Here is your daily overview. You have{' '}
          <span className="text-[#6366f1] font-semibold underline decoration-[#6366f1]/30">5 pending tasks</span> today, with{' '}
          <span className="text-[#dc2626] font-semibold bg-[#dc2626]/10 px-1.5 py-0.5 rounded">2 High Priority</span> items.
          Your spending is well within limits. You logged{' '}
          <span className="text-[#16a34a] font-semibold bg-[#16a34a]/10 px-1.5 py-0.5 rounded">$36.00</span> today, leaving you with{' '}
          <span className="text-[#0891b2] font-semibold">$14.00</span> in your daily budget.
        </p>
        <p className="text-slate-700 text-sm font-normal pl-4 border-l-2 border-slate-300">
          💡 <span className="font-semibold text-slate-850">Next Action:</span> You have a{' '}
          <span className="text-[#d97706] font-medium">Doctor appointment</span> in 2 hours. Your recent notes also prompt you to complete the design system files for the MVP project.
        </p>
      </div>
    </div>
  )
}
