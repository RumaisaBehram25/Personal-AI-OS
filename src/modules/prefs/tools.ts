import { tool } from 'ai'
import { z } from 'zod'
import type { ToolCtx } from '@/modules/chat/tools/context'
import { runTool } from '@/modules/chat/tools/logging'
import * as prefsService from './service'
import * as taskService from '@/modules/tasks/service'
import * as expenseService from '@/modules/expenses/service'

export function prefsTools(ctx: ToolCtx) {
  return {
    getUserContext: tool({
      description:
        'Retrieve information about the current user: their profile (name), preferences (currency, timezone) and a quick snapshot of pending tasks and spending. Use to answer questions like "what is my currency?", "what are my settings?" or "who am I?".',
      parameters: z.object({}),
      execute: async (args) =>
        runTool(ctx, 'getUserContext', args, async () => {
          const [prefs, profileRes, pendingTasks, spending] = await Promise.all([
            prefsService.getPrefs(ctx.supabase, ctx.userId),
            ctx.supabase
              .from('users')
              .select('full_name, email')
              .eq('id', ctx.userId)
              .maybeSingle(),
            taskService.countTasks(ctx.supabase, ctx.userId, 'pending'),
            expenseService.getSpendingSummary(ctx.supabase, ctx.userId),
          ])

          return {
            ok: true,
            profile: {
              name: profileRes.data?.full_name ?? null,
              email: profileRes.data?.email ?? null,
            },
            preferences: {
              currency: prefs.currency,
              timezone: prefs.timezone,
            },
            snapshot: {
              pendingTasks,
              todaySpending: spending.todayTotal,
              weekSpending: spending.weekTotal,
            },
          }
        }),
    }),
  }
}
