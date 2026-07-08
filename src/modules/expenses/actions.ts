'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as service from './service'
import { getPrefs } from '@/modules/prefs/service'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

export async function createExpenseAction(input: {
  amount: number
  category?: string
  description?: string | null
}) {
  const { supabase, userId } = await requireUser()
  const prefs = await getPrefs(supabase, userId)
  await service.createExpense(supabase, userId, {
    ...input,
    currency: prefs.currency,
    source: 'manual',
  })
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
}

export async function deleteExpenseAction(id: string) {
  const { supabase, userId } = await requireUser()
  await service.deleteExpense(supabase, userId, id)
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
}
