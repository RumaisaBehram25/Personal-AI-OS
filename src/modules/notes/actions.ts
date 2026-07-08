'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as service from './service'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

export async function createNoteAction(input: {
  title?: string | null
  content: string
}) {
  const { supabase, userId } = await requireUser()
  await service.createNote(supabase, userId, input)
  revalidatePath('/notes')
  revalidatePath('/dashboard')
}

export async function updateNoteAction(
  id: string,
  input: { title?: string | null; content?: string },
) {
  const { supabase, userId } = await requireUser()
  await service.updateNote(supabase, userId, id, input)
  revalidatePath('/notes')
  revalidatePath('/dashboard')
}

export async function deleteNoteAction(id: string) {
  const { supabase, userId } = await requireUser()
  await service.deleteNote(supabase, userId, id)
  revalidatePath('/notes')
  revalidatePath('/dashboard')
}
