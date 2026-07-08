'use client'

import type { Message } from '@ai-sdk/react'
import {
  CheckCircle2,
  ListTodo,
  Bell,
  FileText,
  AlertCircle,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Receipt,
  Tv,
  Heart,
  Tag,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'

type ToolInvocation = NonNullable<Message['toolInvocations']>[number]
type ToolResult = Extract<ToolInvocation, { state: 'result' }>

interface TaskResult {
  ok: boolean
  error?: string
  reminderCreated?: boolean
  task?: { id: string; title: string; status: string; due_at: string | null }
}
interface ExpenseResult {
  ok: boolean
  error?: string
  expense?: {
    id: string
    amount: number
    currency: string
    category: string
    description: string | null
  }
}
interface ReminderResult {
  ok: boolean
  error?: string
  reminder?: { id: string; message: string; remind_at: string }
}
interface NoteResult {
  ok: boolean
  error?: string
  note?: { id: string; title: string | null }
}

const EXPENSE_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  food: { icon: UtensilsCrossed, bg: 'bg-amber-50', color: 'text-[#d97706]' },
  transport: { icon: Car, bg: 'bg-cyan-50', color: 'text-[#0891b2]' },
  shopping: { icon: ShoppingBag, bg: 'bg-indigo-50', color: 'text-[#6366f1]' },
  bills: { icon: Receipt, bg: 'bg-red-50', color: 'text-[#dc2626]' },
  entertainment: { icon: Tv, bg: 'bg-pink-50', color: 'text-[#ec4899]' },
  health: { icon: Heart, bg: 'bg-green-50', color: 'text-[#16a34a]' },
  other: { icon: Tag, bg: 'bg-slate-100', color: 'text-[#64748b]' },
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function formatWhen(value: string | null | undefined): string | null {
  if (!value) return null
  const d = parseISO(value)
  return isValid(d) ? format(d, 'MMM d, h:mm a') : null
}

function ErrorChip({ message }: { message: string }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  )
}

function RecordCard({
  icon,
  iconBg,
  iconColor,
  label,
  strikethrough = false,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  strikethrough?: boolean
}) {
  const Icon = icon
  return (
    <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-[#e9eef5] bg-[#fafbfc] px-3 py-2.5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <p
        className={`min-w-0 flex-1 truncate text-xs font-semibold text-[#0f172a] ${
          strikethrough ? 'text-[#94a3b8] line-through' : ''
        }`}
      >
        {label}
      </p>
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
    </div>
  )
}

const MUTATING_TOOLS = new Set([
  'createTask',
  'updateTask',
  'completeTask',
  'createReminder',
  'updateReminder',
  'createNote',
])

/**
 * Renders confirmation cards for tool calls that changed data (created/updated a
 * task, expense, reminder, or note). Read-only tools (listTasks, summarizeSpending,
 * etc.) render nothing here — the assistant's own reply already covers them.
 */
export default function ToolResultCards({
  toolInvocations,
}: {
  toolInvocations: ToolInvocation[]
}) {
  const results = toolInvocations.filter((t): t is ToolResult => t.state === 'result')
  if (results.length === 0) return null

  const cards: React.ReactNode[] = []
  const handled = new Set<string>()

  const expenseResults = results.filter((t) => t.toolName === 'logExpense')
  if (expenseResults.length > 0) {
    expenseResults.forEach((t) => handled.add(t.toolCallId))
    const ok = expenseResults
      .map((t) => t.result as ExpenseResult)
      .filter((r) => r.ok && r.expense)
    const failedCount = expenseResults.length - ok.length

    if (ok.length > 0) {
      const items = ok.map((r) => r.expense!)
      const total = items.reduce((s, e) => s + e.amount, 0)
      const currency = items[0]?.currency ?? 'USD'
      cards.push(
        <div
          key="expenses"
          className="mt-2 overflow-hidden rounded-xl border border-[#e9eef5] bg-[#fafbfc]"
        >
          <div className="flex items-center justify-between border-b border-[#e9eef5] bg-white px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#6366f1]">
              {items.length} {items.length === 1 ? 'expense' : 'expenses'} added
            </span>
            <span className="text-sm font-bold text-[#0f172a]">{money(total, currency)}</span>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {items.map((e) => {
              const cfg = EXPENSE_ICONS[e.category] ?? EXPENSE_ICONS.other
              const Icon = cfg.icon
              return (
                <div key={e.id} className="flex items-center gap-2.5 px-3 py-2">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  </div>
                  <span className="flex-1 truncate text-xs font-medium text-[#334155]">
                    {e.description || e.category}
                  </span>
                  <span className="text-xs font-semibold text-[#0f172a]">
                    {money(e.amount, e.currency)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>,
      )
    }
    if (failedCount > 0) {
      cards.push(
        <ErrorChip
          key="expense-error"
          message={`Couldn't log ${failedCount > 1 ? 'some of those expenses' : 'that expense'}`}
        />,
      )
    }
  }

  for (const t of results) {
    if (handled.has(t.toolCallId) || !MUTATING_TOOLS.has(t.toolName)) continue

    if (t.toolName === 'createTask' || t.toolName === 'updateTask') {
      const r = t.result as TaskResult
      if (!r.ok || !r.task) {
        cards.push(<ErrorChip key={t.toolCallId} message={r.error || 'Could not save that task'} />)
        continue
      }
      const when = formatWhen(r.task.due_at)
      cards.push(
        <RecordCard
          key={t.toolCallId}
          icon={ListTodo}
          iconBg="bg-[#6366f1]/10"
          iconColor="text-[#6366f1]"
          label={`${r.task.title}${when ? ` · ${when}` : ''}${r.reminderCreated ? ' · Reminder set' : ''}`}
        />,
      )
    } else if (t.toolName === 'completeTask') {
      const r = t.result as TaskResult
      if (!r.ok || !r.task) {
        cards.push(<ErrorChip key={t.toolCallId} message={r.error || 'Could not complete that task'} />)
        continue
      }
      cards.push(
        <RecordCard
          key={t.toolCallId}
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-[#16a34a]"
          label={r.task.title}
          strikethrough
        />,
      )
    } else if (t.toolName === 'createReminder' || t.toolName === 'updateReminder') {
      const r = t.result as ReminderResult
      if (!r.ok || !r.reminder) {
        cards.push(<ErrorChip key={t.toolCallId} message={r.error || 'Could not save that reminder'} />)
        continue
      }
      const when = formatWhen(r.reminder.remind_at)
      cards.push(
        <RecordCard
          key={t.toolCallId}
          icon={Bell}
          iconBg="bg-cyan-50"
          iconColor="text-[#0891b2]"
          label={`${r.reminder.message}${when ? ` · ${when}` : ''}`}
        />,
      )
    } else if (t.toolName === 'createNote') {
      const r = t.result as NoteResult
      if (!r.ok || !r.note) {
        cards.push(<ErrorChip key={t.toolCallId} message={r.error || 'Could not save that note'} />)
        continue
      }
      cards.push(
        <RecordCard
          key={t.toolCallId}
          icon={FileText}
          iconBg="bg-[#6366f1]/10"
          iconColor="text-[#6366f1]"
          label={`${r.note.title || 'Note'} saved`}
        />,
      )
    }
  }

  if (cards.length === 0) return null
  return <div className="space-y-1.5">{cards}</div>
}
