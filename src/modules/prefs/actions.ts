'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as service from './service'

export async function updatePrefsAction(input: {
  currency?: string
  timezone?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await service.upsertPrefs(supabase, user.id, input)
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/expenses')
}
