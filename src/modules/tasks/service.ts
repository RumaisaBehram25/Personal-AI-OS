import type { SupabaseClient } from '@supabase/supabase-js'
import { startOfDay, endOfDay } from 'date-fns'
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksFilters,
} from './types'

const TABLE = 'tasks'

/**
 * Data-access layer for tasks. Every function takes an authenticated Supabase
 * client so RLS scopes rows to the current user. Shared by UI server actions
 * and by the AI tool-calling layer.
 */

export async function listTasks(
  supabase: SupabaseClient,
  userId: string,
  filters: ListTasksFilters = {},
): Promise<Task[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const now = new Date()
  if (filters.scope === 'today') {
    query = query
      .gte('due_at', startOfDay(now).toISOString())
      .lte('due_at', endOfDay(now).toISOString())
  } else if (filters.scope === 'upcoming') {
    query = query.gte('due_at', now.toISOString())
  } else if (filters.scope === 'overdue') {
    query = query.lt('due_at', now.toISOString()).eq('status', 'pending')
  }

  query = query
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Task[]
}

export async function getTask(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<Task | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Task) ?? null
}

export async function createTask(
  supabase: SupabaseClient,
  userId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      due_at: input.dueAt ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Task
}

export async function updateTask(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.description !== undefined) patch.description = input.description
  if (input.dueAt !== undefined) patch.due_at = input.dueAt
  if (input.status !== undefined) {
    patch.status = input.status
    patch.completed_at = input.status === 'completed' ? new Date().toISOString() : null
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('user_id', userId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Task
}

export async function completeTask(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<Task> {
  return updateTask(supabase, userId, id, { status: 'completed' })
}

export async function deleteTask(
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

export async function countTasks(
  supabase: SupabaseClient,
  userId: string,
  status?: Task['status'],
): Promise<number> {
  let query = supabase
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (status) query = query.eq('status', status)
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}
