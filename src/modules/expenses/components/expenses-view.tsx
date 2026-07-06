'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { EXPENSE_CATEGORIES } from '@/config/constants'
import type { Expense, SpendingSummary } from '../types'
import { createExpenseAction, deleteExpenseAction } from '../actions'

function formatDate(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? format(d, 'MMM d') : ''
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export default function ExpensesView({
  expenses,
  summary,
}: {
  expenses: Expense[]
  summary: SpendingSummary
}) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>('food')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    startTransition(async () => {
      try {
        await createExpenseAction({
          amount: value,
          category,
          description: description.trim() || null,
        })
        setAmount('')
        setDescription('')
        toast.success('Expense logged')
      } catch {
        toast.error('Could not log expense')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteExpenseAction(id)
      } catch {
        toast.error('Could not delete expense')
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[#f1f5f9]/92 px-4 py-4 backdrop-blur-md md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
          Expenses
        </h1>
        <p className="text-xs text-[#64748b] md:text-sm">
          Today {money(summary.todayTotal, summary.currency)} · This week{' '}
          {money(summary.weekTotal, summary.currency)}
        </p>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 md:p-8">
        {/* Add expense */}
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 gap-2 rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm sm:grid-cols-[110px_1fr_140px_auto]"
        >
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm capitalize outline-none focus:border-[#6366f1] focus:bg-white"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
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

        {/* Category breakdown */}
        {summary.byCategory.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.byCategory.map((c) => (
              <span
                key={c.category}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-xs font-medium capitalize text-[#334155]"
              >
                {c.category}
                <span className="font-semibold text-[#6366f1]">
                  {money(c.total, summary.currency)}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* List */}
        {expenses.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#94a3b8]">
            No expenses yet. Add one above or tell the assistant &ldquo;I spent
            $15 on lunch&rdquo;.
          </p>
        ) : (
          <div className="divide-y divide-[#eef2f7] overflow-hidden rounded-xl border border-[#e9eef5] bg-white shadow-sm">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 text-xs font-bold uppercase text-[#6366f1]">
                  {e.category.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#0f172a]">
                    {e.description || e.category}
                  </p>
                  <p className="text-xs capitalize text-[#94a3b8]">
                    {e.category} · {formatDate(e.spent_at)}
                    {e.source === 'chat' ? ' · via chat' : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#0f172a]">
                  {money(e.amount, e.currency)}
                </span>
                <button
                  onClick={() => handleDelete(e.id)}
                  disabled={isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
