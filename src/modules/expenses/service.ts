import type { SupabaseClient } from '@supabase/supabase-js'
import { startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns'
import type {
  Expense,
  CreateExpenseInput,
  ListExpensesFilters,
  SpendingSummary,
} from './types'

const TABLE = 'expenses'

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalize(row: Record<string, unknown>): Expense {
  const expense = row as unknown as Expense
  return { ...expense, amount: toNumber(row.amount) }
}

export async function listExpenses(
  supabase: SupabaseClient,
  userId: string,
  filters: ListExpensesFilters = {},
): Promise<Expense[]> {
  let query = supabase.from(TABLE).select('*').eq('user_id', userId)

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  const now = new Date()
  if (filters.scope === 'today') {
    query = query
      .gte('spent_at', startOfDay(now).toISOString())
      .lte('spent_at', endOfDay(now).toISOString())
  } else if (filters.scope === 'week') {
    query = query.gte('spent_at', startOfWeek(now, { weekStartsOn: 1 }).toISOString())
  } else if (filters.scope === 'month') {
    query = query.gte('spent_at', startOfMonth(now).toISOString())
  }

  query = query.order('spent_at', { ascending: false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(normalize)
}

export async function createExpense(
  supabase: SupabaseClient,
  userId: string,
  input: CreateExpenseInput,
): Promise<Expense> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      amount: input.amount,
      category: input.category ?? 'other',
      description: input.description ?? null,
      currency: input.currency ?? 'USD',
      source: input.source ?? 'manual',
      spent_at: input.spentAt ?? new Date().toISOString(),
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return normalize(data)
}

export async function deleteExpense(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Aggregates spending for the dashboard cards and the AI summary tool.
 * Fetches this week's rows once, then derives today + week totals and a
 * per-category breakdown in memory.
 */
export async function getSpendingSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<SpendingSummary> {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const todayStart = startOfDay(now)

  const { data, error } = await supabase
    .from(TABLE)
    .select('amount, category, currency, spent_at')
    .eq('user_id', userId)
    .gte('spent_at', weekStart.toISOString())
  if (error) throw new Error(error.message)

  const rows = (data ?? []).map((r) => ({
    amount: toNumber((r as { amount: unknown }).amount),
    category: (r as { category: string }).category,
    currency: (r as { currency: string }).currency,
    spent_at: (r as { spent_at: string }).spent_at,
  }))

  let todayTotal = 0
  let weekTotal = 0
  const categoryMap = new Map<string, number>()

  for (const row of rows) {
    weekTotal += row.amount
    if (new Date(row.spent_at) >= todayStart) {
      todayTotal += row.amount
    }
    categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) + row.amount)
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  return {
    todayTotal,
    weekTotal,
    currency: rows[0]?.currency ?? 'USD',
    byCategory,
  }
}
