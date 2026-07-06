'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as service from './service'
import type { ReminderChannel } from './types'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

export async function createReminderAction(input: {
  message: string
  remindAt: string
  channel?: ReminderChannel
}) {
  const { supabase, userId } = await requireUser()
  await service.createReminder(supabase, userId, input)
  revalidatePath('/reminders')
  revalidatePath('/dashboard')
}

export async function updateReminderAction(
  id: string,
  input: { message?: string; remindAt?: string; channel?: ReminderChannel },
) {
  const { supabase, userId } = await requireUser()
  await service.updateReminder(supabase, userId, id, input)
  revalidatePath('/reminders')
  revalidatePath('/dashboard')
}

export async function deleteReminderAction(id: string) {
  const { supabase, userId } = await requireUser()
  await service.deleteReminder(supabase, userId, id)
  revalidatePath('/reminders')
  revalidatePath('/dashboard')
}
