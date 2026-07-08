'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as service from './service'
import type { UpdatePrefsInput } from './types'

/**
 * Saves user preferences. When called from Settings (markTimezoneManual=true)
 * we record that the timezone was chosen explicitly, so the browser auto-detect
 * never overrides it later — even if the user deliberately picks UTC.
 */
export async function updatePrefsAction(
  input: { currency?: string; timezone?: string },
  markTimezoneManual = false,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const patch: UpdatePrefsInput = { ...input }

  // Keep the "was this chosen explicitly?" flag in sync with intent:
  // - Settings save  -> markTimezoneManual=true  (locks in the choice)
  // - Browser detect -> markTimezoneManual=false (allows auto behavior)
  if (input.timezone !== undefined) {
    const current = await service.getPrefs(supabase, user.id)
    patch.preferences = {
      ...current.preferences,
      timezoneSetByUser: markTimezoneManual,
    }
  }

  await service.upsertPrefs(supabase, user.id, patch)
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/expenses')
}
