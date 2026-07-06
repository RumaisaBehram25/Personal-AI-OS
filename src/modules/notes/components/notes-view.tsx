'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, FileText, Pencil, X, Check } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { toast } from 'sonner'
import type { Note } from '../types'
import { createNoteAction, updateNoteAction, deleteNoteAction } from '../actions'

function formatDate(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? format(d, 'MMM d, yyyy') : ''
}

export default function NotesView({ notes }: { notes: Note[] }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('Write something first')
      return
    }
    startTransition(async () => {
      try {
        await createNoteAction({
          title: title.trim() || null,
          content: content.trim(),
        })
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
        await updateNoteAction(id, {
          title: editTitle.trim() || null,
          content: editContent.trim(),
        })
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
      } catch {
        toast.error('Could not delete note')
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[#f1f5f9]/92 px-4 py-4 backdrop-blur-md md:px-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0f172a]">
          <FileText className="h-5 w-5 text-[#6366f1]" />
          Notes
        </h1>
        <p className="text-xs text-[#64748b] md:text-sm">{notes.length} notes</p>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 md:p-8">
        <form
          onSubmit={handleAdd}
          className="space-y-2 rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm font-medium outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a note…"
            rows={3}
            className="w-full resize-y rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add note
            </button>
          </div>
        </form>

        {notes.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#94a3b8]">
            No notes yet. Jot something down above.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex flex-col rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm"
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-sm font-medium outline-none focus:border-[#6366f1] focus:bg-white"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
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
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0f172a]">
                        {note.title || 'Untitled'}
                      </h3>
                      <div className="flex shrink-0 gap-0.5">
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
                    <p className="whitespace-pre-wrap text-sm text-[#475569]">
                      {note.content}
                    </p>
                    <p className="mt-3 text-[10px] font-medium text-[#94a3b8]">
                      {formatDate(note.updated_at)}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
