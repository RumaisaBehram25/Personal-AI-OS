import type { ToolCtx } from './context'
import { taskTools } from '@/modules/tasks/tools'
import { expenseTools } from '@/modules/expenses/tools'
import { reminderTools } from '@/modules/reminders/tools'
import { noteTools } from '@/modules/notes/tools'
import { prefsTools } from '@/modules/prefs/tools'
import { summaryTools } from '@/modules/dashboard/tools'

/**
 * Aggregates every module's tools into the single map passed to streamText.
 * Add a new module's tools here to expose them to the assistant.
 */
export function buildTools(ctx: ToolCtx) {
  return {
    ...taskTools(ctx),
    ...expenseTools(ctx),
    ...reminderTools(ctx),
    ...noteTools(ctx),
    ...prefsTools(ctx),
    ...summaryTools(ctx),
  }
}
