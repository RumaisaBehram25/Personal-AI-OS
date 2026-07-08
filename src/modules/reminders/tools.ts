import { tool } from 'ai'
import { z } from 'zod'
import type { ToolCtx } from '@/modules/chat/tools/context'
import { runTool } from '@/modules/chat/tools/logging'
import * as reminderService from './service'

export function reminderTools(ctx: ToolCtx) {
  return {
    createReminder: tool({
      description:
        'Create a reminder for the user at a specific time. Use when they say "remind me to …" without it necessarily being a to-do task.',
      parameters: z.object({
        message: z.string().describe('What to remind the user about'),
        remindAt: z
          .string()
          .describe('When to remind, as an ISO 8601 timestamp'),
        channel: z.enum(['in_app', 'email']).optional(),
      }),
      execute: async (args) =>
        runTool(ctx, 'createReminder', args, async () => {
          const reminder = await reminderService.createReminder(
            ctx.supabase,
            ctx.userId,
            {
              message: args.message,
              remindAt: args.remindAt,
              channel: args.channel,
            },
          )
          return {
            ok: true,
            reminder: {
              id: reminder.id,
              message: reminder.message,
              remind_at: reminder.remind_at,
            },
          }
        }),
    }),

    updateReminder: tool({
      description:
        'Update an existing reminder: change its message, time, or channel. If you do not know the reminder id, call listReminders first.',
      parameters: z.object({
        id: z.string().describe('The id of the reminder to update'),
        message: z.string().optional().describe('New reminder message'),
        remindAt: z
          .string()
          .optional()
          .describe('New time as an ISO 8601 timestamp'),
        channel: z.enum(['in_app', 'email']).optional(),
      }),
      execute: async (args) =>
        runTool(ctx, 'updateReminder', args, async () => {
          const reminder = await reminderService.updateReminder(
            ctx.supabase,
            ctx.userId,
            args.id,
            {
              message: args.message,
              remindAt: args.remindAt,
              channel: args.channel,
            },
          )
          return {
            ok: true,
            reminder: {
              id: reminder.id,
              message: reminder.message,
              remind_at: reminder.remind_at,
            },
          }
        }),
    }),

    listReminders: tool({
      description:
        'List the user\'s reminders. Use to answer "what reminders do I have?".',
      parameters: z.object({
        upcomingOnly: z
          .boolean()
          .optional()
          .describe('Only return reminders that have not passed yet'),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (args) =>
        runTool(ctx, 'listReminders', args, async () => {
          const reminders = await reminderService.listReminders(
            ctx.supabase,
            ctx.userId,
            { upcomingOnly: args.upcomingOnly, limit: args.limit ?? 20 },
          )
          return {
            ok: true,
            count: reminders.length,
            reminders: reminders.map((r) => ({
              id: r.id,
              message: r.message,
              remind_at: r.remind_at,
            })),
          }
        }),
    }),
  }
}
