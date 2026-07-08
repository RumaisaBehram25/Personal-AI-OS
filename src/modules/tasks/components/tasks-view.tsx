'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  Plus,
  Check,
  Trash2,
  Loader2,
  CalendarClock,
  Pencil,
  X,
  Search,
  CheckSquare,
  Clock,
  AlertCircle,
  ListTodo,
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
type FilterTab = 'all' | 'pending' | 'completed'

const BUCKET_ORDER: Bucket[] = ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later', 'No date']

const BUCKET_TONE: Record<Bucket, string> = {
  Overdue: 'text-[#dc2626]',
  Today: 'text-[#d97706]',
  Tomorrow: 'text-[#0891b2]',
  'This week': 'text-[#64748b]',
  Later: 'text-[#64748b]',
  'No date': 'text-[#94a3b8]',
}

const BUCKET_BADGE: Record<Bucket, string> = {
  Overdue: 'bg-red-50 text-[#dc2626]',
  Today: 'bg-amber-50 text-[#d97706]',
  Tomorrow: 'bg-cyan-50 text-[#0891b2]',
  'This week': 'bg-slate-100 text-[#64748b]',
  Later: 'bg-slate-100 text-[#64748b]',
  'No date': 'bg-slate-100 text-[#94a3b8]',
}

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

export default function TasksView({ tasks }: { tasks: Task[] }) {
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      try {
        await createTaskAction({
          title: title.trim(),
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        })
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
      try { await fn() }
      catch { toast.error(errorMsg) }
    })
  }

  const pending = tasks.filter((t) => t.status === 'pending')
  const completed = tasks.filter((t) => t.status === 'completed')
  const overdue = pending.filter((t) => bucketOf(t) === 'Overdue')
  const completionPct = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0

  const filteredTasks = useMemo(() => {
    let base = tasks
    if (activeTab === 'pending') base = pending
    if (activeTab === 'completed') base = completed
    if (search.trim()) {
      const q = search.toLowerCase()
      base = base.filter((t) => t.title.toLowerCase().includes(q))
    }
    return base
  }, [tasks, activeTab, search, pending, completed])

  const filteredPending = filteredTasks.filter((t) => t.status === 'pending')
  const filteredCompleted = filteredTasks.filter((t) => t.status === 'completed')

  const grouped = BUCKET_ORDER.map((bucket) => ({
    bucket,
    items: filteredPending
      .filter((t) => bucketOf(t) === bucket)
      .sort((a, b) => {
        if (!a.due_at) return 1
        if (!b.due_at) return -1
        return a.due_at.localeCompare(b.due_at)
      }),
  })).filter((g) => g.items.length > 0)

  const stats = [
    { label: 'Total', value: tasks.length, icon: ListTodo, color: 'text-[#6366f1]', bg: 'bg-[#6366f1]/10' },
    { label: 'Pending', value: pending.length, icon: Clock, color: 'text-[#d97706]', bg: 'bg-amber-50' },
    { label: 'Overdue', value: overdue.length, icon: AlertCircle, color: 'text-[#dc2626]', bg: 'bg-red-50' },
    { label: 'Completed', value: completed.length, icon: CheckSquare, color: 'text-[#16a34a]', bg: 'bg-green-50' },
  ]

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ]

  const renderPendingRow = (task: Task) => {
    const bucket = bucketOf(task)

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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
        className="group flex items-center gap-3 rounded-xl border border-[#e9eef5] bg-white p-3.5 shadow-sm transition-all hover:border-[#6366f1]/30 hover:bg-[#6366f1]/[0.02]"
      >
        <button
          onClick={() => runAction(() => completeTaskAction(task.id), 'Could not complete task')}
          disabled={isPending}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#cbd5e1] text-transparent transition-all hover:border-[#6366f1] hover:bg-[#6366f1]/10 hover:text-[#6366f1]"
          title="Mark complete"
        >
          <Check className="h-3 w-3" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#0f172a]">{task.title}</p>
          {formatDue(task.due_at) && (
            <p className={`mt-0.5 flex items-center gap-1 text-xs ${BUCKET_TONE[bucket]}`}>
              <CalendarClock className="h-3 w-3" />
              {formatDue(task.due_at)}
            </p>
          )}
        </div>

        {(bucket === 'Overdue' || bucket === 'Today') && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${BUCKET_BADGE[bucket]}`}>
            {bucket}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => startEdit(task)}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-[#6366f1]/10 hover:text-[#6366f1]"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => runAction(() => deleteTaskAction(task.id), 'Could not delete task')}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      {/* Page Header */}
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[rgba(241,245,249,0.92)] px-4 py-4 backdrop-blur-md md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Tasks</h1>
            <p className="text-xs text-[#64748b] md:text-sm">
              {pending.length} pending · {completed.length} completed
            </p>
          </div>
          <button
            onClick={() => document.getElementById('add-task-input')?.focus()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-5 p-4 md:p-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm">
                <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-[#0f172a]">{s.value}</p>
                <p className="text-xs text-[#64748b]">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="rounded-xl border border-[#e9eef5] bg-white px-4 py-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748b]">Overall progress</span>
              <span className="text-xs font-semibold text-[#6366f1]">{completionPct}% complete</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
              <div
                className="h-full rounded-full bg-[#6366f1] transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Search + filter tabs */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>
          <div className="flex rounded-lg border border-[#e2e8f0] bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#6366f1] text-white'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add task form — only shown on All / Pending tabs */}
        {activeTab !== 'completed' && (
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-2 rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm sm:flex-row"
          >
            <input
              id="add-task-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task…"
              className="flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
            />
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b] outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </form>
        )}

        {/* Empty state */}
        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#e9eef5] bg-white py-16 text-center shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1]/10">
              <CheckSquare className="h-6 w-6 text-[#6366f1]" />
            </div>
            <p className="text-sm font-medium text-[#0f172a]">
              {search ? 'No tasks match your search' : 'No tasks yet'}
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              {search
                ? 'Try a different keyword'
                : 'Add a task above or ask the AI assistant to create one'}
            </p>
          </div>
        )}

        {/* Pending grouped by bucket */}
        {grouped.map((group) => (
          <section key={group.bucket} className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className={`text-xs font-semibold uppercase tracking-wide ${BUCKET_TONE[group.bucket]}`}>
                {group.bucket}
              </h2>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${BUCKET_BADGE[group.bucket]}`}>
                {group.items.length}
              </span>
            </div>
            {group.items.map((task) => renderPendingRow(task))}
          </section>
        ))}

        {/* Completed */}
        {filteredCompleted.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                Completed
              </h2>
              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-[#16a34a]">
                {filteredCompleted.length}
              </span>
            </div>
            {filteredCompleted.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-3 rounded-xl border border-[#e9eef5] bg-white/60 p-3.5"
              >
                <button
                  onClick={() => runAction(() => reopenTaskAction(task.id), 'Could not reopen task')}
                  disabled={isPending}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors"
                  title="Reopen"
                >
                  <Check className="h-3 w-3" />
                </button>
                <p className="min-w-0 flex-1 truncate text-sm text-[#94a3b8] line-through">
                  {task.title}
                </p>
                <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => runAction(() => deleteTaskAction(task.id), 'Could not delete task')}
                    disabled={isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
