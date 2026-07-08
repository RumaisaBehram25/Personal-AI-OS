import { createAdminClient } from '@/lib/supabase/admin'
import type { ToolCtx } from './context'

type ExecStatus = 'success' | 'error'

/**
 * Writes an exec_logs row. Uses the service-role client because exec_logs has
 * no INSERT RLS policy (users may only SELECT their own rows). Logging must
 * never break a tool, so all errors here are swallowed.
 */
async function writeExecLog(
  ctx: ToolCtx,
  toolName: string,
  args: unknown,
  result: unknown,
  status: ExecStatus,
  durationMs: number,
  errorMessage?: string,
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('exec_logs').insert({
      user_id: ctx.userId,
      conversation_id: ctx.conversationId,
      tool_name: toolName,
      arguments: args ?? null,
      result: result ?? null,
      status,
      error_message: errorMessage ?? null,
      duration_ms: durationMs,
    })
  } catch {
    // Never let logging failures affect the tool result.
  }
}

/**
 * Runs a tool's logic with timing, structured error handling, and exec_logs
 * auditing. On failure it returns a safe error object so the model can recover
 * gracefully instead of the whole stream crashing.
 */
export async function runTool(
  ctx: ToolCtx,
  toolName: string,
  args: unknown,
  fn: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const start = Date.now()
  try {
    const result = await fn()
    void writeExecLog(ctx, toolName, args, result, 'success', Date.now() - start)
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    void writeExecLog(ctx, toolName, args, null, 'error', Date.now() - start, message)
    return { ok: false, error: message }
  }
}
