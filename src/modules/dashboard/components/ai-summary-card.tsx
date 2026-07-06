'use client'

import { Sparkles, RefreshCw } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

export default function AiSummaryCard() {
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/summary', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const data = (await res.json()) as { summary?: string }
      setSummary(data.summary ?? 'No summary available right now.')
    } catch {
      setSummary('Could not generate your summary right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="w-full bg-white rounded-lg border border-[#e9eef5] shadow-md p-6 md:p-7 border-l-4 border-l-[#6366f1] bg-gradient-to-r from-[#6366f1]/[0.07] to-[#0891b2]/[0.07] relative overflow-hidden transition-all duration-300 hover:shadow-lg">
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
            <p className="text-xs text-[#64748b]">HypoOS intelligence engine</p>
          </div>
        </div>

        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4f46e5] transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Summary</span>
        </button>
      </div>

      <div className="relative z-10 text-[#0f172a] leading-relaxed text-sm md:text-base font-medium">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-[92%] bg-slate-200 rounded" />
            <div className="h-4 w-[70%] bg-slate-200 rounded" />
          </div>
        ) : (
          <p className="text-slate-800 whitespace-pre-wrap">{summary}</p>
        )}
      </div>
    </div>
  )
}
