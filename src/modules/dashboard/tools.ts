import { tool } from 'ai'
import { z } from 'zod'
import type { ToolCtx } from '@/modules/chat/tools/context'
import { runTool } from '@/modules/chat/tools/logging'
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
          return { ok: true, ...facts }
        }),
    }),
  }
}
