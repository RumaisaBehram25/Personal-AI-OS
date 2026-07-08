'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  Pencil,
  X,
  Check,
  Search,
  ArrowDownAZ,
  Clock,
  SortAsc,
} from 'lucide-react'
import { format, isValid, parseISO, isThisWeek } from 'date-fns'
import { toast } from 'sonner'
import type { Note } from '../types'
import { createNoteAction, updateNoteAction, deleteNoteAction } from '../actions'

function formatDate(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? format(d, 'MMM d, yyyy') : ''
}

function wordCount(text: string | null): number {
  if (!text?.trim()) return 0
  return text.trim().split(/\s+/).length
}

type SortMode = 'newest' | 'oldest' | 'az'

const NOTE_ACCENTS = [
  { border: 'border-l-[#6366f1]', icon: 'text-[#6366f1]', iconBg: 'bg-[#6366f1]/10' },
  { border: 'border-l-[#0891b2]', icon: 'text-[#0891b2]', iconBg: 'bg-cyan-50' },
  { border: 'border-l-[#16a34a]', icon: 'text-[#16a34a]', iconBg: 'bg-green-50' },
  { border: 'border-l-[#d97706]', icon: 'text-[#d97706]', iconBg: 'bg-amber-50' },
  { border: 'border-l-[#ec4899]', icon: 'text-[#ec4899]', iconBg: 'bg-pink-50' },
]

function accentFor(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return NOTE_ACCENTS[n % NOTE_ACCENTS.length]
}

export default function NotesView({ notes }: { notes: Note[] }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('Write something first')
      return
    }
    startTransition(async () => {
      try {
        await createNoteAction({ title: title.trim() || null, content: content.trim() })
        setTitle('')
        setContent('')
        toast.success('Note saved')
      } catch {
        toast.error('Could not save note')
      }
    })
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title ?? '')
    setEditContent(note.content ?? '')
  }

  const saveEdit = (id: string) => {
    startTransition(async () => {
      try {
        await updateNoteAction(id, { title: editTitle.trim() || null, content: editContent.trim() })
        setEditingId(null)
        toast.success('Note updated')
      } catch {
        toast.error('Could not update note')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteNoteAction(id)
        toast.success('Note deleted')
      } catch {
        toast.error('Could not delete note')
      }
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const thisWeekCount = useMemo(
    () => notes.filter((n) => isThisWeek(parseISO(n.created_at), { weekStartsOn: 1 })).length,
    [notes],
  )

  const filtered = useMemo(() => {
    let base = notes
    if (search.trim()) {
      const q = search.toLowerCase()
      base = base.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q),
      )
    }
    return [...base].sort((a, b) => {
      if (sort === 'newest') return b.updated_at.localeCompare(a.updated_at)
      if (sort === 'oldest') return a.updated_at.localeCompare(b.updated_at)
      return (a.title ?? 'Untitled').localeCompare(b.title ?? 'Untitled')
    })
  }, [notes, search, sort])

  const sortOptions: { key: SortMode; label: string; icon: React.ElementType }[] = [
    { key: 'newest', label: 'Newest', icon: Clock },
    { key: 'oldest', label: 'Oldest', icon: SortAsc },
    { key: 'az',     label: 'A – Z',  icon: ArrowDownAZ },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[rgba(241,245,249,0.92)] px-4 py-4 backdrop-blur-md md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Notes</h1>
            <p className="text-xs text-[#64748b] md:text-sm">
              {notes.length} notes · {thisWeekCount} this week
            </p>
          </div>
          <button
            onClick={() => document.getElementById('note-content')?.focus()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 space-y-5 p-4 md:p-8">

        {/* Compose form */}
        <form
          onSubmit={handleAdd}
          className="space-y-2 rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm font-medium outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
          />
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a note…"
            rows={3}
            className="w-full resize-y rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#94a3b8]">
              {content.length > 0 ? `${wordCount(content)} words · ${content.length} chars` : ''}
            </span>
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save note
            </button>
          </div>
        </form>

        {/* Search + sort */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>
          <div className="flex rounded-lg border border-[#e2e8f0] bg-white p-1">
            {sortOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    sort === opt.key ? 'bg-[#6366f1] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#e9eef5] bg-white py-16 text-center shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1]/10">
              <FileText className="h-6 w-6 text-[#6366f1]" />
            </div>
            <p className="text-sm font-medium text-[#0f172a]">
              {search ? 'No notes match your search' : 'No notes yet'}
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              {search ? 'Try a different keyword' : 'Jot something down above or ask the AI assistant'}
            </p>
          </div>
        )}

        {/* Notes grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((note) => {
              const accent = accentFor(note.id)
              const expanded = expandedIds.has(note.id)
              const words = wordCount(note.content)

              return (
                <div
                  key={note.id}
                  className={`group flex flex-col rounded-xl border border-[#e9eef5] border-l-4 bg-white shadow-sm transition-shadow hover:shadow-md ${accent.border}`}
                >
                  {editingId === note.id ? (
                    <div className="space-y-2 p-4">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-sm font-medium outline-none focus:border-[#6366f1] focus:bg-white"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={5}
                        className="w-full resize-y rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#f8fafc]"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(note.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#6366f1] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4f46e5]"
                        >
                          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2 px-4 pt-4">
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accent.iconBg}`}>
                          <FileText className={`h-3.5 w-3.5 ${accent.icon}`} />
                        </div>
                        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => startEdit(note)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-[#6366f1]/10 hover:text-[#6366f1]"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="flex-1 px-4 pb-1 pt-2">
                        {note.title && (
                          <h3 className="mb-1 text-sm font-semibold text-[#0f172a] leading-snug">
                            {note.title}
                          </h3>
                        )}
                        <p
                          className={`text-sm text-[#475569] leading-relaxed whitespace-pre-wrap ${
                            expanded ? '' : 'line-clamp-4'
                          }`}
                        >
                          {note.content}
                        </p>
                        {(note.content?.split('\n').length ?? 0) > 4 || (note.content?.length ?? 0) > 200 ? (
                          <button
                            onClick={() => toggleExpand(note.id)}
                            className={`mt-1 text-[11px] font-medium ${accent.icon} hover:underline`}
                          >
                            {expanded ? 'Show less' : 'Read more'}
                          </button>
                        ) : null}
                      </div>

                      {/* Card footer */}
                      <div className="flex items-center justify-between px-4 pb-3 pt-2">
                        <span className="text-[10px] text-[#94a3b8]">{formatDate(note.updated_at)}</span>
                        <span className="text-[10px] text-[#94a3b8]">{words} {words === 1 ? 'word' : 'words'}</span>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
