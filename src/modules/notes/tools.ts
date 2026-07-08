import { tool } from 'ai'
import { z } from 'zod'
import type { ToolCtx } from '@/modules/chat/tools/context'
import { runTool } from '@/modules/chat/tools/logging'
import * as noteService from './service'

export function noteTools(ctx: ToolCtx) {
  return {
    createNote: tool({
      description:
        'Save a note for the user. Use when they want to jot down or remember a piece of information (not a to-do or reminder).',
      parameters: z.object({
        content: z.string().describe('The note body'),
        title: z.string().optional().describe('Optional short title'),
      }),
      execute: async (args) =>
        runTool(ctx, 'createNote', args, async () => {
          const note = await noteService.createNote(ctx.supabase, ctx.userId, {
            title: args.title,
            content: args.content,
          })
          return { ok: true, note: { id: note.id, title: note.title } }
        }),
    }),

    listNotes: tool({
      description: 'List the user\'s saved notes.',
      parameters: z.object({
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (args) =>
        runTool(ctx, 'listNotes', args, async () => {
          const notes = await noteService.listNotes(
            ctx.supabase,
            ctx.userId,
            args.limit ?? 20,
          )
          return {
            ok: true,
            count: notes.length,
            notes: notes.map((n) => ({
              id: n.id,
              title: n.title,
              content: n.content,
            })),
          }
        }),
    }),
  }
}
