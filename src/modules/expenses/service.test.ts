import { describe, it, expect } from 'vitest'
import { createMockClient } from '@/test/mock-supabase'
import * as expenseService from './service'

const USER = 'user-123'

describe('expenses service', () => {
  it('createExpense records a user-scoped expense with defaults', async () => {
    const { client, captures } = createMockClient(() => ({
      data: { id: 'e1', amount: 42, category: 'shopping' },
    }))

    const expense = await expenseService.createExpense(client, USER, {
      amount: 42,
      category: 'shopping',
      description: 'Walmart',
    })

    expect(expense.amount).toBe(42)
    expect(captures[0].table).toBe('expenses')
    expect(captures[0].op).toBe('insert')
    expect(captures[0].payload).toMatchObject({
      user_id: USER,
      amount: 42,
      category: 'shopping',
      source: 'manual',
    })
  })

  it('normalizes string amounts into numbers', async () => {
    const { client } = createMockClient(() => ({
      data: { id: 'e1', amount: '15.50', category: 'food' },
    }))

    const expense = await expenseService.createExpense(client, USER, {
      amount: 15.5,
    })

    expect(expense.amount).toBe(15.5)
    expect(typeof expense.amount).toBe('number')
  })

  it('getSpendingSummary derives today, week and category totals', async () => {
    const now = new Date()
    const earlierToday = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const twoDaysAgo = new Date(
      now.getTime() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { client } = createMockClient(() => ({
      data: [
        { amount: 10, category: 'food', currency: 'USD', spent_at: earlierToday },
        { amount: 5, category: 'food', currency: 'USD', spent_at: earlierToday },
        {
          amount: 20,
          category: 'transport',
          currency: 'USD',
          spent_at: twoDaysAgo,
        },
      ],
    }))

    const summary = await expenseService.getSpendingSummary(client, USER)

    expect(summary.todayTotal).toBe(15)
    expect(summary.weekTotal).toBe(35)
    expect(summary.byCategory[0]).toEqual({ category: 'transport', total: 20 })
  })

  it('deleteExpense is scoped to user and id', async () => {
    const { client, captures } = createMockClient(() => ({ data: null }))

    await expenseService.deleteExpense(client, USER, 'e1')

    expect(captures[0].op).toBe('delete')
    expect(captures[0].filters).toMatchObject({ user_id: USER, id: 'e1' })
  })
})
