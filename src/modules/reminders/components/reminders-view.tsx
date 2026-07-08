'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  Bell,
  Mail,
  Pencil,
  Check,
  X,
  Search,
  Clock,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  format,
  isValid,
  parseISO,
  isPast,
  isToday,
  isTomorrow,
  isThisWeek,
  formatDistanceToNow,
} from 'date-fns'
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

function countdownLabel(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ''
}

type Bucket = 'Today' | 'Tomorrow' | 'This week' | 'Later'
type FilterTab = 'all' | 'upcoming' | 'sent'

const BUCKET_ORDER: Bucket[] = ['Today', 'Tomorrow', 'This week', 'Later']

const BUCKET_TONE: Record<Bucket, string> = {
  Today: 'text-[#d97706]',
  Tomorrow: 'text-[#0891b2]',
  'This week': 'text-[#64748b]',
  Later: 'text-[#64748b]',
}

const BUCKET_BADGE: Record<Bucket, string> = {
  Today: 'bg-amber-50 text-[#d97706]',
  Tomorrow: 'bg-cyan-50 text-[#0891b2]',
  'This week': 'bg-slate-100 text-[#64748b]',
  Later: 'bg-slate-100 text-[#64748b]',
}

function bucketOf(r: Reminder): Bucket {
  const d = parseISO(r.remind_at)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isThisWeek(d, { weekStartsOn: 1 })) return 'This week'
  return 'Later'
}

export default function RemindersView({ reminders }: { reminders: Reminder[] }) {
  const [message, setMessage] = useState('')
  const [remindAt, setRemindAt] = useState('')
  const [channel, setChannel] = useState<ReminderChannel>('in_app')
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

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
        toast.success('Reminder deleted')
      } catch {
        toast.error('Could not delete reminder')
      }
    })
  }

  const upcoming = reminders.filter((r) => !r.is_sent && !isPast(parseISO(r.remind_at)))
  const overdue = reminders.filter((r) => !r.is_sent && isPast(parseISO(r.remind_at)))
  const dueToday = upcoming.filter((r) => isToday(parseISO(r.remind_at)))
  const sent = reminders.filter((r) => r.is_sent)

  const filteredReminders = useMemo(() => {
    let base = reminders
    if (activeTab === 'upcoming') base = base.filter((r) => !r.is_sent)
    if (activeTab === 'sent') base = base.filter((r) => r.is_sent)
    if (search.trim()) {
      const q = search.toLowerCase()
      base = base.filter((r) => r.message.toLowerCase().includes(q))
    }
    return base
  }, [reminders, activeTab, search])

  const filteredOverdue = filteredReminders.filter((r) => !r.is_sent && isPast(parseISO(r.remind_at)))
  const filteredUpcoming = filteredReminders.filter((r) => !r.is_sent && !isPast(parseISO(r.remind_at)))
  const filteredSent = filteredReminders.filter((r) => r.is_sent)

  const grouped = BUCKET_ORDER.map((bucket) => ({
    bucket,
    items: filteredUpcoming
      .filter((r) => bucketOf(r) === bucket)
      .sort((a, b) => a.remind_at.localeCompare(b.remind_at)),
  })).filter((g) => g.items.length > 0)

  const stats = [
    { label: 'Upcoming', value: upcoming.length, icon: Clock, color: 'text-[#6366f1]', bg: 'bg-[#6366f1]/10' },
    { label: 'Due today', value: dueToday.length, icon: CalendarClock, color: 'text-[#d97706]', bg: 'bg-amber-50' },
    { label: 'Overdue', value: overdue.length, icon: AlertCircle, color: 'text-[#dc2626]', bg: 'bg-red-50' },
    { label: 'Sent', value: sent.length, icon: CheckCircle2, color: 'text-[#16a34a]', bg: 'bg-green-50' },
  ]

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'sent', label: 'Sent' },
  ]

  const channelOptions: { key: ReminderChannel; label: string; icon: React.ElementType }[] = [
    { key: 'in_app', label: 'In-app', icon: Bell },
    { key: 'email', label: 'Email', icon: Mail },
  ]

  const renderRow = (r: Reminder, type: 'overdue' | 'upcoming' | 'sent') => {
    const ChannelIcon = r.channel === 'email' ? Mail : Bell

    if (editingId === r.id) {
      return (
        <div
          key={r.id}
          className="flex flex-col gap-2 rounded-xl border border-[#6366f1]/40 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center"
        >
          <input
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            className="flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <input
            type="datetime-local"
            value={editRemindAt}
            onChange={(e) => setEditRemindAt(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b] outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <div className="flex shrink-0 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-1">
            {channelOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setEditChannel(opt.key)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    editChannel === opt.key ? 'bg-[#6366f1] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSaveEdit(r.id)}
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
        key={r.id}
        className={`group flex items-center gap-3 rounded-xl border p-3.5 shadow-sm transition-all ${
          type === 'overdue'
            ? 'border-l-4 border-l-[#dc2626] border-[#e9eef5] bg-red-50/30 hover:bg-red-50/50'
            : type === 'sent'
              ? 'border-[#e9eef5] bg-white/60'
              : 'border-[#e9eef5] bg-white hover:border-[#6366f1]/30 hover:bg-[#6366f1]/[0.02]'
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            type === 'overdue' ? 'bg-red-100 text-[#dc2626]' : type === 'sent' ? 'bg-slate-100 text-[#94a3b8]' : 'bg-cyan-50 text-[#0891b2]'
          }`}
        >
          <ChannelIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${type === 'sent' ? 'text-[#94a3b8]' : 'text-[#0f172a]'}`}>
            {r.message}
          </p>
          <p className={`mt-0.5 flex items-center gap-1 text-xs ${type === 'overdue' ? 'text-[#dc2626]' : 'text-[#94a3b8]'}`}>
            {type === 'sent' ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />
                Sent
              </>
            ) : (
              countdownLabel(r.remind_at)
            )}
            {r.task_id ? ' · from task' : ''}
          </p>
        </div>

        {type === 'overdue' && (
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[#dc2626]">
            Overdue
          </span>
        )}

        <span className="shrink-0 text-xs text-[#94a3b8]">{formatWhen(r.remind_at)}</span>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {type !== 'sent' && (
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
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[rgba(241,245,249,0.92)] px-4 py-4 backdrop-blur-md md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Reminders</h1>
            <p className="text-xs text-[#64748b] md:text-sm">
              {upcoming.length} upcoming · {overdue.length} overdue
            </p>
          </div>
          <button
            onClick={() => document.getElementById('reminder-message-input')?.focus()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
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

        {/* Add reminder form */}
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-2 rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <input
            id="reminder-message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Remind me to…"
            className="flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
          />
          <input
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b] outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
          />
          <div className="flex shrink-0 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-1">
            {channelOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setChannel(opt.key)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    channel === opt.key ? 'bg-[#6366f1] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </form>

        {/* Search + filter tabs */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reminders…"
              className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>
          <div className="flex rounded-lg border border-[#e2e8f0] bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-[#6366f1] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filteredReminders.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#e9eef5] bg-white py-16 text-center shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1]/10">
              <Bell className="h-6 w-6 text-[#6366f1]" />
            </div>
            <p className="text-sm font-medium text-[#0f172a]">
              {search || activeTab !== 'all' ? 'No matching reminders' : 'No reminders yet'}
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              {search || activeTab !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add one above, create a task with a due date, or ask the assistant to remind you'}
            </p>
          </div>
        )}

        {/* Overdue */}
        {filteredOverdue.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#dc2626]">Overdue</h2>
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-[#dc2626]">
                {filteredOverdue.length}
              </span>
            </div>
            <div className="space-y-2">
              {filteredOverdue
                .sort((a, b) => a.remind_at.localeCompare(b.remind_at))
                .map((r) => renderRow(r, 'overdue'))}
            </div>
          </section>
        )}

        {/* Upcoming, grouped by bucket */}
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
            <div className="space-y-2">{group.items.map((r) => renderRow(r, 'upcoming'))}</div>
          </section>
        ))}

        {/* Sent */}
        {filteredSent.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Sent</h2>
              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-[#16a34a]">
                {filteredSent.length}
              </span>
            </div>
            <div className="space-y-2">
              {filteredSent
                .sort((a, b) => b.remind_at.localeCompare(a.remind_at))
                .map((r) => renderRow(r, 'sent'))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
