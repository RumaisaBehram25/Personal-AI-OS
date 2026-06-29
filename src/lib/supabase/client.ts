import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/config/env'
import type { Database } from '@/types/database'

/**
 * Supabase client for Client Components (runs in the browser).
 * Uses the public anon key only — RLS protects the data.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
