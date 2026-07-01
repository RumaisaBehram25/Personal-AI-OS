import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

// This client uses the service role key and bypasses RLS.
// Only import it from server-side code (Server Actions, Route Handlers,
// Server Components). Never import it into a Client Component.

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
