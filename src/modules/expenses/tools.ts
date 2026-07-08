import { tool } from 'ai'
import { z } from 'zod'
import type { ToolCtx } from '@/modules/chat/tools/context'
import { runTool } from '@/modules/chat/tools/logging'
import * as expenseService from './service'

export function expenseTools(ctx: ToolCtx) {
  return {
    logExpense: tool({
      description:
        'Record an expense the user mentions spending (e.g. "I spent $15 on lunch").',
      parameters: z.object({
        amount: z.number().positive().describe('Amount spent, e.g. 15'),
        category: z
          .enum([
            'food',
            'transport',
            'shopping',
            'bills',
            'entertainment',
            'health',
            'other',
          ])
          .optional()
          .describe('Best-fit category; defaults to other'),
        description: z
          .string()
          .optional()
          .describe('What the expense was for, e.g. lunch'),
        currency: z.string().optional().describe('ISO currency code, defaults to USD'),
        spentAt: z
          .string()
          .optional()
          .describe('When it was spent as an ISO 8601 timestamp; defaults to now'),
      }),
      execute: async (args) =>
        runTool(ctx, 'logExpense', args, async () => {
          const expense = await expenseService.createExpense(
            ctx.supabase,
            ctx.userId,
            {
              amount: args.amount,
              category: args.category,
              description: args.description,
              currency: args.currency,
              source: 'chat',
              spentAt: args.spentAt,
            },
          )
          return {
            ok: true,
            expense: {
              id: expense.id,
              amount: expense.amount,
              currency: expense.currency,
              category: expense.category,
              description: expense.description,
            },
          }
        }),
    }),

    listExpenses: tool({
      description:
        'List the user\'s recent expenses. Use to answer questions about spending history.',
      parameters: z.object({
        scope: z.enum(['today', 'week', 'month', 'all']).optional(),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (args) =>
        runTool(ctx, 'listExpenses', args, async () => {
          const expenses = await expenseService.listExpenses(
            ctx.supabase,
            ctx.userId,
            { scope: args.scope, category: args.category, limit: args.limit ?? 20 },
          )
          return {
            ok: true,
            count: expenses.length,
            expenses: expenses.map((e) => ({
              id: e.id,
              amount: e.amount,
              currency: e.currency,
              category: e.category,
              description: e.description,
              spent_at: e.spent_at,
            })),
          }
        }),
    }),

    summarizeSpending: tool({
      description:
        'Summarize the user\'s spending: today total, this week total, and a per-category breakdown.',
      parameters: z.object({}),
      execute: async (args) =>
        runTool(ctx, 'summarizeSpending', args, async () => {
          const summary = await expenseService.getSpendingSummary(
            ctx.supabase,
            ctx.userId,
          )
          return { ok: true, summary }
        }),
    }),
  }
}
