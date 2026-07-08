import type { ExpenseCategory } from '@/config/constants'

export type { ExpenseCategory }

export type ExpenseSource = 'manual' | 'chat'

export interface Expense {
  id: string
  user_id: string
  amount: number
  currency: string
  category: string
  description: string | null
  source: ExpenseSource
  spent_at: string
  created_at: string
}

export interface CreateExpenseInput {
  amount: number
  category?: string
  description?: string | null
  currency?: string
  source?: ExpenseSource
  spentAt?: string
}

export type ExpenseScope = 'today' | 'week' | 'month' | 'all'

export interface ListExpensesFilters {
  scope?: ExpenseScope
  category?: string
  limit?: number
}

export interface SpendingSummary {
  todayTotal: number
  weekTotal: number
  currency: string
  byCategory: { category: string; total: number }[]
}
