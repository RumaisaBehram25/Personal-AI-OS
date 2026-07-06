import type { SupabaseClient } from '@supabase/supabase-js'
import type { Note, CreateNoteInput, UpdateNoteInput } from './types'

const TABLE = 'notes'

export async function listNotes(
  supabase: SupabaseClient,
  userId: string,
  limit?: number,
): Promise<Note[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Note[]
}

export async function createNote(
  supabase: SupabaseClient,
  userId: string,
  input: CreateNoteInput,
): Promise<Note> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      title: input.title ?? null,
      content: input.content,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Note
}

export async function updateNote(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: UpdateNoteInput,
): Promise<Note> {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.content !== undefined) patch.content = input.content

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('user_id', userId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Note
}

export async function deleteNote(
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
