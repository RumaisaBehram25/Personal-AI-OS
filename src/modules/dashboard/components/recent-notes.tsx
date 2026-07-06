import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import type { Note } from '@/modules/notes/types'

function formatDate(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? format(d, 'MMM d, yyyy') : ''
}

export default function RecentNotes({ notes }: { notes: Note[] }) {
  return (
    <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full transition-all duration-250 hover:shadow-md hover:border-[#6366f1]/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-[#6366f1]" />
          <span>Recent Notes</span>
        </h3>
        <Link
          href="/notes"
          className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#94a3b8]">No notes yet.</p>
      ) : (
        <div className="space-y-2.5">
          {notes.map((note) => (
            <Link
              key={note.id}
              href="/notes"
              className="group block p-3.5 bg-[#fafbfc] border border-[#f1f5f9] hover:border-[#6366f1]/20 hover:bg-[#6366f1]/[0.02] rounded-md transition-all duration-150"
            >
              <div className="flex justify-between items-start mb-1 gap-4">
                <span className="text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#6366f1] transition-colors">
                  {note.title || 'Untitled'}
                </span>
                <span className="text-[10px] text-[#94a3b8] font-medium whitespace-nowrap">
                  {formatDate(note.updated_at)}
                </span>
              </div>
              <p className="text-xs text-[#64748b] truncate leading-normal">
                {note.content}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
