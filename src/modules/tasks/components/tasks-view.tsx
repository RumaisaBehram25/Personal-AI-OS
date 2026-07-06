'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  Check,
  Trash2,
  Loader2,
  CalendarClock,
  Pencil,
  X,
} from 'lucide-react'
import {
  format,
  isValid,
  parseISO,
  isPast,
  isToday,
  isTomorrow,
  isThisWeek,
} from 'date-fns'
import { toast } from 'sonner'
import type { Task } from '../types'
import {
  createTaskAction,
  updateTaskAction,
  completeTaskAction,
  reopenTaskAction,
  deleteTaskAction,
} from '../actions'

function formatDue(due: string | null): string | null {
  if (!due) return null
  const d = parseISO(due)
  return isValid(d) ? format(d, 'MMM d, h:mm a') : null
}

function toLocalInput(due: string | null): string {
  if (!due) return ''
  const d = parseISO(due)
  return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm") : ''
}

type Bucket = 'Overdue' | 'Today' | 'Tomorrow' | 'This week' | 'Later' | 'No date'

const BUCKET_ORDER: Bucket[] = [
  'Overdue',
  'Today',
  'Tomorrow',
  'This week',
  'Later',
  'No date',
]

function bucketOf(task: Task): Bucket {
  if (!task.due_at) return 'No date'
  const d = parseISO(task.due_at)
  if (!isValid(d)) return 'No date'
  if (isToday(d)) return 'Today'
  if (isPast(d)) return 'Overdue'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isThisWeek(d, { weekStartsOn: 1 })) return 'This week'
  return 'Later'
}

const BUCKET_TONE: Record<Bucket, string> = {
  Overdue: 'text-[#dc2626]',
  Today: 'text-[#d97706]',
  Tomorrow: 'text-[#0891b2]',
  'This week': 'text-[#64748b]',
  Later: 'text-[#64748b]',
  'No date': 'text-[#94a3b8]',
}

export default function TasksView({ tasks }: { tasks: Task[] }) {
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [isPending, startTransition] = useTransition()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDueAt, setEditDueAt] = useState('')

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDueAt(toLocalInput(task.due_at))
  }

  const cancelEdit = () => setEditingId(null)

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }
    startTransition(async () => {
      try {
        await updateTaskAction(id, {
          title: editTitle.trim(),
          dueAt: editDueAt ? new Date(editDueAt).toISOString() : null,
        })
        setEditingId(null)
        toast.success('Task updated')
      } catch {
        toast.error('Could not update task')
      }
    })
  }

  const pending = tasks.filter((t) => t.status === 'pending')
  const completed = tasks.filter((t) => t.status === 'completed')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const payload = {
      title: title.trim(),
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
    }
    startTransition(async () => {
      try {
        await createTaskAction(payload)
        setTitle('')
        setDueAt('')
        toast.success('Task added')
      } catch {
        toast.error('Could not add task')
      }
    })
  }

  const runAction = (fn: () => Promise<void>, errorMsg: string) => {
    startTransition(async () => {
      try {
        await fn()
      } catch {
        toast.error(errorMsg)
      }
    })
  }

  // Group pending tasks into due-date buckets, sorted within each by due date.
  const grouped = BUCKET_ORDER.map((bucket) => ({
    bucket,
    items: pending
      .filter((t) => bucketOf(t) === bucket)
      .sort((a, b) => {
        if (!a.due_at) return 1
        if (!b.due_at) return -1
        return a.due_at.localeCompare(b.due_at)
      }),
  })).filter((g) => g.items.length > 0)

  const renderPendingRow = (task: Task) => {
    if (editingId === task.id) {
      return (
        <div
          key={task.id}
          className="flex flex-col gap-2 rounded-xl border border-[#6366f1]/40 bg-white p-3.5 shadow-sm sm:flex-row"
        >
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <input
            type="datetime-local"
            value={editDueAt}
            onChange={(e) => setEditDueAt(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b] outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSaveEdit(task.id)}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50"
              title="Save"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={cancelEdit}
              disabled={isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )
    }

    return (
      <div
        key={task.id}
        className="flex items-center gap-3 rounded-xl border border-[#e9eef5] bg-white p-3.5 shadow-sm"
      >
        <button
          onClick={() =>
            runAction(
              () => completeTaskAction(task.id),
              'Could not complete task',
            )
          }
          disabled={isPending}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#cbd5e1] text-transparent transition-colors hover:border-[#6366f1] hover:text-[#6366f1]"
          title="Mark complete"
        >
          <Check className="h-3 w-3" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#0f172a]">
            {task.title}
          </p>
          {formatDue(task.due_at) && (
            <p
              className={`mt-0.5 flex items-center gap-1 text-xs ${
                BUCKET_TONE[bucketOf(task)]
              }`}
            >
              <CalendarClock className="h-3 w-3" />
              {formatDue(task.due_at)}
            </p>
          )}
        </div>
        <button
          onClick={() => startEdit(task)}
          disabled={isPending}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-[#6366f1]/10 hover:text-[#6366f1]"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() =>
            runAction(() => deleteTaskAction(task.id), 'Could not delete task')
          }
          disabled={isPending}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[#f1f5f9]/92 px-4 py-4 backdrop-blur-md md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Tasks</h1>
        <p className="text-xs text-[#64748b] md:text-sm">
          {pending.length} pending · {completed.length} completed
        </p>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 md:p-8">
        {/* Add task */}
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-2 rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm sm:flex-row"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b] outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </button>
        </form>

        {tasks.length === 0 && (
          <p className="py-10 text-center text-sm text-[#94a3b8]">
            No tasks yet. Add one above or ask the assistant to create one.
          </p>
        )}

        {/* Pending, grouped by due date */}
        {grouped.map((group) => (
          <section key={group.bucket} className="space-y-2">
            <h2
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
                BUCKET_TONE[group.bucket]
              }`}
            >
              {group.bucket}
              <span className="rounded-full bg-[#e2e8f0] px-1.5 text-[10px] font-bold text-[#64748b]">
                {group.items.length}
              </span>
            </h2>
            {group.items.map((task) => renderPendingRow(task))}
          </section>
        ))}

        {/* Completed */}
        {completed.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Completed
            </h2>
            {completed.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-[#e9eef5] bg-white/60 p-3.5"
              >
                <button
                  onClick={() =>
                    runAction(
                      () => reopenTaskAction(task.id),
                      'Could not reopen task',
                    )
                  }
                  disabled={isPending}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white"
                  title="Reopen"
                >
                  <Check className="h-3 w-3" />
                </button>
                <p className="min-w-0 flex-1 truncate text-sm text-[#94a3b8] line-through">
                  {task.title}
                </p>
                <button
                  onClick={() =>
                    runAction(
                      () => deleteTaskAction(task.id),
                      'Could not delete task',
                    )
                  }
                  disabled={isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
