'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  Bell,
  Mail,
  AppWindow,
  Clock,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { format, isValid, parseISO, isPast } from 'date-fns'
import { toast } from 'sonner'
import type { Reminder, ReminderChannel } from '../types'
import {
  createReminderAction,
  updateReminderAction,
  deleteReminderAction,
} from '../actions'

function formatWhen(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? format(d, 'EEE, MMM d · h:mm a') : ''
}

function toLocalInput(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm") : ''
}

export default function RemindersView({
  reminders,
}: {
  reminders: Reminder[]
}) {
  const [message, setMessage] = useState('')
  const [remindAt, setRemindAt] = useState('')
  const [channel, setChannel] = useState<ReminderChannel>('in_app')
  const [isPending, startTransition] = useTransition()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMessage, setEditMessage] = useState('')
  const [editRemindAt, setEditRemindAt] = useState('')
  const [editChannel, setEditChannel] = useState<ReminderChannel>('in_app')

  const startEdit = (r: Reminder) => {
    setEditingId(r.id)
    setEditMessage(r.message)
    setEditRemindAt(toLocalInput(r.remind_at))
    setEditChannel(r.channel)
  }

  const cancelEdit = () => setEditingId(null)

  const handleSaveEdit = (id: string) => {
    if (!editMessage.trim() || !editRemindAt) {
      toast.error('Add a message and a time')
      return
    }
    startTransition(async () => {
      try {
        await updateReminderAction(id, {
          message: editMessage.trim(),
          remindAt: new Date(editRemindAt).toISOString(),
          channel: editChannel,
        })
        setEditingId(null)
        toast.success('Reminder updated')
      } catch {
        toast.error('Could not update reminder')
      }
    })
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !remindAt) {
      toast.error('Add a message and a time')
      return
    }
    startTransition(async () => {
      try {
        await createReminderAction({
          message: message.trim(),
          remindAt: new Date(remindAt).toISOString(),
          channel,
        })
        setMessage('')
        setRemindAt('')
        toast.success('Reminder set')
      } catch {
        toast.error('Could not set reminder')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteReminderAction(id)
      } catch {
        toast.error('Could not delete reminder')
      }
    })
  }

  const upcoming = reminders.filter(
    (r) => !r.is_sent && !isPast(parseISO(r.remind_at)),
  )
  const past = reminders.filter(
    (r) => r.is_sent || isPast(parseISO(r.remind_at)),
  )

  const renderRow = (r: Reminder, dim: boolean) => {
    if (editingId === r.id) {
      return (
        <div
          key={r.id}
          className="grid grid-cols-1 gap-2 rounded-xl border border-[#6366f1]/40 bg-white p-3.5 shadow-sm sm:grid-cols-[1fr_180px_130px_auto]"
        >
          <input
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <input
            type="datetime-local"
            value={editRemindAt}
            onChange={(e) => setEditRemindAt(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b] outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <select
            value={editChannel}
            onChange={(e) => setEditChannel(e.target.value as ReminderChannel)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          >
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
          </select>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSaveEdit(r.id)}
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
        key={r.id}
        className={`flex items-center gap-3 rounded-xl border border-[#e9eef5] p-3.5 shadow-sm ${
          dim ? 'bg-white/60' : 'bg-white'
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[#6366f1]">
          {r.channel === 'email' ? (
            <Mail className="h-4 w-4" />
          ) : (
            <AppWindow className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium ${
              dim ? 'text-[#94a3b8]' : 'text-[#0f172a]'
            }`}
          >
            {r.message}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#94a3b8]">
            <Clock className="h-3 w-3" />
            {formatWhen(r.remind_at)}
            {r.task_id ? ' · from task' : ''}
          </p>
        </div>
        {!dim && (
          <button
            onClick={() => startEdit(r)}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-[#6366f1]/10 hover:text-[#6366f1]"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => handleDelete(r.id)}
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
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0f172a]">
          <Bell className="h-5 w-5 text-[#6366f1]" />
          Reminders
        </h1>
        <p className="text-xs text-[#64748b] md:text-sm">
          {upcoming.length} upcoming
        </p>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 md:p-8">
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 gap-2 rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm sm:grid-cols-[1fr_180px_130px_auto]"
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Remind me to…"
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <input
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b] outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as ReminderChannel)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          >
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
          </select>
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
            Add
          </button>
        </form>

        {reminders.length === 0 && (
          <p className="py-10 text-center text-sm text-[#94a3b8]">
            No reminders yet. Add one above, create a task with a due date, or ask
            the assistant to remind you.
          </p>
        )}

        {upcoming.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Upcoming
            </h2>
            {upcoming.map((r) => renderRow(r, false))}
          </section>
        )}

        {past.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Past
            </h2>
            {past.map((r) => renderRow(r, true))}
          </section>
        )}
      </div>
    </div>
  )
}
