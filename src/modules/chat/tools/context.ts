import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Per-request context passed to every AI tool. `supabase` is the user-scoped
 * client (RLS enforced), so tools can only read/write the current user's rows.
 */
export interface ToolCtx {
  supabase: SupabaseClient
  userId: string
  conversationId: string | null
}
