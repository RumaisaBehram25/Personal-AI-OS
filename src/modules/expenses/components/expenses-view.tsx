'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Receipt,
  Tv,
  Heart,
  Tag,
  TrendingDown,
  CalendarDays,
  LayoutGrid,
  DollarSign,
} from 'lucide-react'
import {
  format,
  isValid,
  parseISO,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  startOfMonth,
} from 'date-fns'
import { toast } from 'sonner'
import { EXPENSE_CATEGORIES } from '@/config/constants'
import type { Expense, SpendingSummary } from '../types'
import { createExpenseAction, deleteExpenseAction } from '../actions'

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  food:          { icon: UtensilsCrossed, color: 'text-[#d97706]', bg: 'bg-amber-50',   label: 'Food' },
  transport:     { icon: Car,             color: 'text-[#0891b2]', bg: 'bg-cyan-50',    label: 'Transport' },
  shopping:      { icon: ShoppingBag,     color: 'text-[#6366f1]', bg: 'bg-indigo-50',  label: 'Shopping' },
  bills:         { icon: Receipt,         color: 'text-[#dc2626]', bg: 'bg-red-50',     label: 'Bills' },
  entertainment: { icon: Tv,              color: 'text-[#ec4899]', bg: 'bg-pink-50',    label: 'Entertainment' },
  health:        { icon: Heart,           color: 'text-[#16a34a]', bg: 'bg-green-50',   label: 'Health' },
  other:         { icon: Tag,             color: 'text-[#64748b]', bg: 'bg-slate-100',  label: 'Other' },
}

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function formatDate(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? format(d, 'MMM d, h:mm a') : ''
}

type DateGroup = 'Today' | 'Yesterday' | 'This week' | 'Earlier'
type ScopeFilter = 'all' | 'today' | 'week' | 'month'

const DATE_GROUP_ORDER: DateGroup[] = ['Today', 'Yesterday', 'This week', 'Earlier']

function dateGroupOf(spent_at: string): DateGroup {
  const d = parseISO(spent_at)
  if (!isValid(d)) return 'Earlier'
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isThisWeek(d, { weekStartsOn: 1 })) return 'This week'
  return 'Earlier'
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
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    startTransition(async () => {
      try {
        await createExpenseAction({ amount: value, category, description: description.trim() || null })
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
        toast.success('Expense deleted')
      } catch {
        toast.error('Could not delete expense')
      }
    })
  }

  const monthTotal = useMemo(() => {
    const start = startOfMonth(new Date())
    return expenses
      .filter((e) => { const d = parseISO(e.spent_at); return isValid(d) && d >= start })
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    let base = expenses
    if (scopeFilter === 'today') base = base.filter((e) => isToday(parseISO(e.spent_at)))
    else if (scopeFilter === 'week') base = base.filter((e) => isThisWeek(parseISO(e.spent_at), { weekStartsOn: 1 }))
    else if (scopeFilter === 'month') base = base.filter((e) => isThisMonth(parseISO(e.spent_at)))
    if (categoryFilter) base = base.filter((e) => e.category === categoryFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      base = base.filter((e) => e.description?.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
    }
    return base
  }, [expenses, scopeFilter, categoryFilter, search])

  const grouped = DATE_GROUP_ORDER.map((group) => ({
    group,
    items: filteredExpenses.filter((e) => dateGroupOf(e.spent_at) === group),
  })).filter((g) => g.items.length > 0)

  const totalSpend = summary.byCategory.reduce((s, c) => s + c.total, 0)

  const stats = [
    { label: 'Today',        value: money(summary.todayTotal, summary.currency), icon: DollarSign,  color: 'text-[#6366f1]', bg: 'bg-[#6366f1]/10' },
    { label: 'This week',    value: money(summary.weekTotal,  summary.currency), icon: TrendingDown, color: 'text-[#d97706]', bg: 'bg-amber-50' },
    { label: 'This month',   value: money(monthTotal,         summary.currency), icon: CalendarDays, color: 'text-[#0891b2]', bg: 'bg-cyan-50' },
    { label: 'Total entries',value: String(expenses.length),                     icon: LayoutGrid,   color: 'text-[#64748b]', bg: 'bg-slate-100' },
  ]

  const scopeTabs: { key: ScopeFilter; label: string }[] = [
    { key: 'all',   label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'Week' },
    { key: 'month', label: 'Month' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[rgba(241,245,249,0.92)] px-4 py-4 backdrop-blur-md md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Expenses</h1>
            <p className="text-xs text-[#64748b] md:text-sm">
              Today {money(summary.todayTotal, summary.currency)} · This week{' '}
              {money(summary.weekTotal, summary.currency)}
            </p>
          </div>
          <button
            onClick={() => document.getElementById('amount-input')?.focus()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Log Expense
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
                <p className="text-lg font-bold text-[#0f172a]">{s.value}</p>
                <p className="text-xs text-[#64748b]">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Category breakdown */}
        {summary.byCategory.length > 0 && (
          <div className="rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Spending by category
            </h2>
            <div className="space-y-2.5">
              {summary.byCategory.map((c) => {
                const config = getCategoryConfig(c.category)
                const Icon = config.icon
                const pct = totalSpend > 0 ? (c.total / totalSpend) * 100 : 0
                const isActive = categoryFilter === c.category

                return (
                  <button
                    key={c.category}
                    onClick={() => setCategoryFilter(isActive ? null : c.category)}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                      isActive
                        ? 'bg-[#6366f1]/[0.06] ring-1 ring-[#6366f1]/20'
                        : 'hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium capitalize text-[#0f172a]">{c.category}</span>
                        <span className="text-xs font-semibold text-[#0f172a]">
                          {money(c.total, summary.currency)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className="h-full rounded-full bg-[#6366f1] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-[#94a3b8]">{pct.toFixed(0)}%</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Add expense form */}
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 gap-2 rounded-xl border border-[#e9eef5] bg-white p-4 shadow-sm sm:grid-cols-[110px_1fr_140px_auto]"
        >
          <input
            id="amount-input"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm capitalize outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </form>

        {/* Search + scope filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses…"
              className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/[0.06] px-2.5 py-1.5 text-xs font-medium text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors"
              >
                {categoryFilter} ×
              </button>
            )}
            <div className="flex rounded-lg border border-[#e2e8f0] bg-white p-1">
              {scopeTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setScopeFilter(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    scopeFilter === tab.key
                      ? 'bg-[#6366f1] text-white'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredExpenses.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#e9eef5] bg-white py-16 text-center shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1]/10">
              <Receipt className="h-6 w-6 text-[#6366f1]" />
            </div>
            <p className="text-sm font-medium text-[#0f172a]">
              {search || categoryFilter ? 'No matching expenses' : 'No expenses yet'}
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              {search || categoryFilter
                ? 'Try adjusting your filters'
                : 'Log one above or tell the assistant "I spent $15 on lunch"'}
            </p>
          </div>
        )}

        {/* Grouped expense list */}
        {grouped.map(({ group, items }) => (
          <section key={group} className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">{group}</h2>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-[#64748b]">
                {items.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e9eef5] bg-white shadow-sm divide-y divide-[#f1f5f9]">
              {items.map((e) => {
                const config = getCategoryConfig(e.category)
                const Icon = config.icon
                return (
                  <div
                    key={e.id}
                    className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-[#fafbfc]"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0f172a]">
                        {e.description || config.label}
                      </p>
                      <p className="text-xs text-[#94a3b8]">
                        <span className={`capitalize font-medium ${config.color}`}>{e.category}</span>
                        {' · '}
                        {formatDate(e.spent_at)}
                        {e.source === 'chat' && ' · via AI'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#0f172a]">
                      {money(e.amount, e.currency)}
                    </span>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
