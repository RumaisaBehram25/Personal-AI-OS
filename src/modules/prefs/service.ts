import type { SupabaseClient } from '@supabase/supabase-js'
import type { Prefs, UpdatePrefsInput } from './types'

const TABLE = 'prefs'

export const DEFAULT_PREFS: Prefs = {
  timezone: 'UTC',
  currency: 'USD',
  preferences: {},
}

export async function getPrefs(
  supabase: SupabaseClient,
  userId: string,
): Promise<Prefs> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('timezone, currency, preferences')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return DEFAULT_PREFS
  return {
    timezone: data.timezone ?? 'UTC',
    currency: data.currency ?? 'USD',
    preferences: (data.preferences as Record<string, unknown>) ?? {},
  }
}

export async function upsertPrefs(
  supabase: SupabaseClient,
  userId: string,
  input: UpdatePrefsInput,
): Promise<Prefs> {
  const patch: Record<string, unknown> = { user_id: userId }
  if (input.timezone !== undefined) patch.timezone = input.timezone
  if (input.currency !== undefined) patch.currency = input.currency
  if (input.preferences !== undefined) patch.preferences = input.preferences

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(patch, { onConflict: 'user_id' })
    .select('timezone, currency, preferences')
    .single()
  if (error) throw new Error(error.message)
  return {
    timezone: data.timezone ?? 'UTC',
    currency: data.currency ?? 'USD',
    preferences: (data.preferences as Record<string, unknown>) ?? {},
  }
}
