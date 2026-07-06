import { tool } from 'ai'
import { z } from 'zod'
import type { ToolCtx } from '@/modules/chat/tools/context'
import { runTool } from '@/modules/chat/tools/logging'
import { formatInTimeZone } from '@/lib/datetime'
import { getSummaryFacts } from './service'

export function summaryTools(ctx: ToolCtx) {
  return {
    getDailySummary: tool({
      description:
        'Get a snapshot of the user\'s day: pending tasks, tasks completed today, today\'s and this week\'s spending, and upcoming reminders. Use to answer "what does my day look like?" or "give me a summary".',
      parameters: z.object({}),
      execute: async (args) =>
        runTool(ctx, 'getDailySummary', args, async () => {
          const facts = await getSummaryFacts(ctx.supabase, ctx.userId)
          const tz = facts.timezone || 'UTC'

          // Hand the model times already formatted in the user's timezone so it
          // never has to convert from UTC itself.
          return {
            ok: true,
            ...facts,
            now: formatInTimeZone(new Date().toISOString(), tz),
            pendingTasks: facts.pendingTasks.map((t) => ({
              title: t.title,
              due: t.due_at ? formatInTimeZone(t.due_at, tz) : null,
            })),
            upcomingReminders: facts.upcomingReminders.map((r) => ({
              message: r.message,
              at: formatInTimeZone(r.remind_at, tz),
            })),
          }
        }),
    }),
  }
}
