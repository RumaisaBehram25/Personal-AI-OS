'use client'

import { FileText, ChevronRight } from 'lucide-react'

interface RecentNotesProps {
  isLoading?: boolean
}

const NOTES = [
  {
    id: 1,
    title: 'Project Brainstorming',
    preview: 'Ideas for the upcoming AI operating system features including widgets...',
    date: 'July 6, 2026',
  },
  {
    id: 2,
    title: 'Weekly Groceries',
    preview: 'Milk, eggs, coffee beans, bread, olive oil, and some snacks.',
    date: 'July 5, 2026',
  },
  {
    id: 3,
    title: 'Meeting Notes - July 5',
    preview: 'Aligned with stakeholders on the MVP layout and finalized the roadmap.',
    date: 'July 5, 2026',
  },
]

export default function RecentNotes({ isLoading = false }: RecentNotesProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full animate-pulse">
        <div className="flex justify-between items-center mb-5">
          <div className="h-5 w-28 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 bg-[#fafbfc] border border-[#f1f5f9] rounded-md h-[72px] space-y-2"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
              <div className="h-3 w-[85%] bg-slate-155 bg-slate-200 rounded" />
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
          <FileText className="h-4.5 w-4.5 text-[#6366f1]" />
          <span>Recent Notes</span>
        </h3>
        <a
          href="/notes"
          className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-2.5">
        {NOTES.map((note) => (
          <a
            key={note.id}
            href={`/notes`}
            className="group block p-3.5 bg-[#fafbfc] border border-[#f1f5f9] hover:border-[#6366f1]/20 hover:bg-[#6366f1]/[0.02] rounded-md transition-all duration-150"
          >
            <div className="flex justify-between items-start mb-1 gap-4">
              <span className="text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#6366f1] transition-colors">
                {note.title}
              </span>
              <span className="text-[10px] text-[#94a3b8] font-medium whitespace-nowrap">
                {note.date}
              </span>
            </div>
            <p className="text-xs text-[#64748b] truncate leading-normal">
              {note.preview}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
