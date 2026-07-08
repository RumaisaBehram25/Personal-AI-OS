'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteConversation } from './service'

export async function deleteConversationAction(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await deleteConversation(supabase, user.id, id)
  revalidatePath('/chat')
  redirect('/chat?new=1')
}
