'use client'

import { Calendar, ChevronRight, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpcomingTasksProps {
  isLoading?: boolean
}

const TASKS = [
  {
    id: 1,
    title: 'Finalize MVP design system',
    priority: 'high',
    dueDate: 'Today, 5:00 PM',
  },
  {
    id: 2,
    title: 'Refactor auth middleware',
    priority: 'high',
    dueDate: 'Today, 10:00 PM',
  },
  {
    id: 3,
    title: 'Prepare presentation slides',
    priority: 'medium',
    dueDate: 'Tomorrow, 9:00 AM',
  },
  {
    id: 4,
    title: 'Review pull requests',
    priority: 'low',
    dueDate: 'July 8, 2026',
  },
  {
    id: 5,
    title: 'Update project documentation',
    priority: 'low',
    dueDate: 'July 9, 2026',
  },
]

export default function UpcomingTasks({ isLoading = false }: UpcomingTasksProps) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-[#dc2626] border-red-100'
      case 'medium':
        return 'bg-amber-50 text-[#d97706] border-amber-100'
      case 'low':
      default:
        return 'bg-green-50 text-[#16a34a] border-green-100'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full animate-pulse">
        <div className="flex justify-between items-center mb-5">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-[#fafbfc] border border-[#f1f5f9] rounded-md h-[54px]"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-slate-200 rounded" />
                <div className="h-4 w-44 bg-slate-200 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-12 bg-slate-200 rounded-full" />
                <div className="h-4 w-20 bg-slate-100 rounded" />
              </div>
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
          <CheckSquare className="h-4.5 w-4.5 text-[#6366f1]" />
          <span>Upcoming Tasks</span>
        </h3>
        <a
          href="/tasks"
          className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-2.5">
        {TASKS.map((task) => (
          <div
            key={task.id}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#fafbfc] border border-[#f1f5f9] hover:border-[#6366f1]/20 hover:bg-[#6366f1]/[0.02] rounded-md transition-all duration-150 gap-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="checkbox"
                readOnly
                checked={false}
                className="h-4 w-4 rounded border-slate-300 text-[#6366f1] focus:ring-[#6366f1] pointer-events-none"
              />
              <span className="text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#6366f1] transition-colors">
                {task.title}
              </span>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wide',
                  getPriorityStyles(task.priority),
                )}
              >
                {task.priority}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#64748b] font-medium shrink-0">
                <Calendar className="h-3 w-3" />
                {task.dueDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
