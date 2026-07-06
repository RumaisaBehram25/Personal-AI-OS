import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Reminder,
  CreateReminderInput,
  ListRemindersFilters,
} from './types'

const TABLE = 'reminders'

export async function listReminders(
  supabase: SupabaseClient,
  userId: string,
  filters: ListRemindersFilters = {},
): Promise<Reminder[]> {
  let query = supabase.from(TABLE).select('*').eq('user_id', userId)

  if (filters.upcomingOnly) {
    query = query
      .eq('is_sent', false)
      .gte('remind_at', new Date().toISOString())
  }

  query = query.order('remind_at', { ascending: true })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Reminder[]
}

export async function createReminder(
  supabase: SupabaseClient,
  userId: string,
  input: CreateReminderInput,
): Promise<Reminder> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      task_id: input.taskId ?? null,
      message: input.message,
      remind_at: input.remindAt,
      channel: input.channel ?? 'in_app',
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Reminder
}

export async function deleteReminder(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markReminderSent(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_sent: true })
    .eq('user_id', userId)
    .eq('id', id)
  if (error) throw new Error(error.message)
}
