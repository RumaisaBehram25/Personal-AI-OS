import { tool } from 'ai'
import { z } from 'zod'
import type { ToolCtx } from '@/modules/chat/tools/context'
import { runTool } from '@/modules/chat/tools/logging'
import * as taskService from './service'
import * as reminderService from '@/modules/reminders/service'

export function taskTools(ctx: ToolCtx) {
  return {
    createTask: tool({
      description:
        'Create a new to-do task for the user. Use when they want to remember, plan, or be reminded to do something.',
      parameters: z.object({
        title: z.string().describe('Short title of the task'),
        description: z.string().optional().describe('Optional extra detail'),
        dueAt: z
          .string()
          .optional()
          .describe('Due date/time as an ISO 8601 timestamp, if the user gave one'),
      }),
      execute: async (args) =>
        runTool(ctx, 'createTask', args, async () => {
          const task = await taskService.createTask(ctx.supabase, ctx.userId, {
            title: args.title,
            description: args.description,
            dueAt: args.dueAt,
          })

          // A task with a due date automatically gets a linked reminder.
          let reminderCreated = false
          if (task.due_at) {
            try {
              await reminderService.createReminder(ctx.supabase, ctx.userId, {
                message: task.title,
                remindAt: task.due_at,
                taskId: task.id,
              })
              reminderCreated = true
            } catch {
              // A failed reminder should not fail task creation.
            }
          }

          return {
            ok: true,
            reminderCreated,
            task: {
              id: task.id,
              title: task.title,
              status: task.status,
              due_at: task.due_at,
            },
          }
        }),
    }),

    listTasks: tool({
      description:
        'List the user\'s tasks. Use to answer questions like "what tasks do I have today?" or "what\'s pending?".',
      parameters: z.object({
        scope: z
          .enum(['today', 'upcoming', 'overdue', 'all'])
          .optional()
          .describe('Which tasks to return; defaults to all'),
        status: z.enum(['pending', 'completed']).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (args) =>
        runTool(ctx, 'listTasks', args, async () => {
          const tasks = await taskService.listTasks(ctx.supabase, ctx.userId, {
            scope: args.scope,
            status: args.status,
            limit: args.limit ?? 20,
          })
          return {
            ok: true,
            count: tasks.length,
            tasks: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              due_at: t.due_at,
            })),
          }
        }),
    }),

    updateTask: tool({
      description:
        'Update an existing task: change its title, description, due date, or status. If you do not know the task id, call listTasks first.',
      parameters: z.object({
        id: z.string().describe('The id of the task to update'),
        title: z.string().optional().describe('New title'),
        description: z.string().optional().describe('New description'),
        dueAt: z
          .string()
          .optional()
          .describe('New due date/time as an ISO 8601 timestamp'),
        status: z.enum(['pending', 'completed']).optional(),
      }),
      execute: async (args) =>
        runTool(ctx, 'updateTask', args, async () => {
          const task = await taskService.updateTask(ctx.supabase, ctx.userId, args.id, {
            title: args.title,
            description: args.description,
            dueAt: args.dueAt,
            status: args.status,
          })
          return {
            ok: true,
            task: {
              id: task.id,
              title: task.title,
              status: task.status,
              due_at: task.due_at,
            },
          }
        }),
    }),

    completeTask: tool({
      description:
        'Mark a task as completed. If you do not know the task id, call listTasks first to find it.',
      parameters: z.object({
        id: z.string().describe('The id of the task to complete'),
      }),
      execute: async (args) =>
        runTool(ctx, 'completeTask', args, async () => {
          const task = await taskService.completeTask(
            ctx.supabase,
            ctx.userId,
            args.id,
          )
          return {
            ok: true,
            task: { id: task.id, title: task.title, status: task.status },
          }
        }),
    }),
  }
}
