import Link from 'next/link'
import { Calendar, ChevronRight, CheckSquare } from 'lucide-react'
import { format, isValid, parseISO, isToday, isPast } from 'date-fns'
import type { Task } from '@/modules/tasks/types'

function dueLabel(due: string | null): { text: string; tone: string } {
  if (!due) return { text: 'No date', tone: 'text-[#94a3b8]' }
  const d = parseISO(due)
  if (!isValid(d)) return { text: 'No date', tone: 'text-[#94a3b8]' }
  if (isPast(d) && !isToday(d))
    return { text: format(d, 'MMM d'), tone: 'text-[#dc2626]' }
  if (isToday(d))
    return { text: `Today, ${format(d, 'h:mm a')}`, tone: 'text-[#d97706]' }
  return { text: format(d, 'MMM d, h:mm a'), tone: 'text-[#64748b]' }
}

export default function UpcomingTasks({ tasks }: { tasks: Task[] }) {
  return (
    <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full transition-all duration-250 hover:shadow-md hover:border-[#6366f1]/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
          <CheckSquare className="h-4.5 w-4.5 text-[#6366f1]" />
          <span>Upcoming Tasks</span>
        </h3>
        <Link
          href="/tasks"
          className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#94a3b8]">
          No pending tasks. You&rsquo;re all caught up!
        </p>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const due = dueLabel(task.due_at)
            return (
              <div
                key={task.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#fafbfc] border border-[#f1f5f9] hover:border-[#6366f1]/20 hover:bg-[#6366f1]/[0.02] rounded-md transition-all duration-150 gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-[#cbd5e1]" />
                  <span className="text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#6366f1] transition-colors">
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${due.tone}`}
                  >
                    <Calendar className="h-3 w-3" />
                    {due.text}
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
