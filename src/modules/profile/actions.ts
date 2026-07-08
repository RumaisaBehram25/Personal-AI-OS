'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

export async function updateProfileAction(input: {
  fullName: string
}): Promise<{ error?: string }> {
  const fullName = input.fullName.trim()
  if (!fullName) return { error: 'Name cannot be empty' }

  const { supabase, user } = await requireUser()

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  })
  if (authError) return { error: authError.message }

  await supabase
    .from('users')
    .update({ full_name: fullName })
    .eq('id', user.id)

  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return {}
}

export async function changePasswordAction(input: {
  newPassword: string
  confirmPassword: string
}): Promise<{ error?: string }> {
  if (input.newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }
  if (input.newPassword !== input.confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const { supabase } = await requireUser()

  const { error } = await supabase.auth.updateUser({ password: input.newPassword })
  if (error) return { error: error.message }

  return {}
}
