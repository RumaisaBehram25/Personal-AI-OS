'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as service from './service'
import * as reminderService from '@/modules/reminders/service'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

export async function createTaskAction(input: {
  title: string
  dueAt?: string | null
}) {
  const { supabase, userId } = await requireUser()
  const task = await service.createTask(supabase, userId, input)

  if (task.due_at) {
    try {
      await reminderService.createReminder(supabase, userId, {
        message: task.title,
        remindAt: task.due_at,
        taskId: task.id,
      })
    } catch {
      // A failed reminder should not fail task creation.
    }
  }

  revalidatePath('/tasks')
  revalidatePath('/reminders')
  revalidatePath('/dashboard')
}

export async function updateTaskAction(
  id: string,
  input: { title?: string; dueAt?: string | null },
) {
  const { supabase, userId } = await requireUser()
  await service.updateTask(supabase, userId, id, input)
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function completeTaskAction(id: string) {
  const { supabase, userId } = await requireUser()
  await service.completeTask(supabase, userId, id)
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function reopenTaskAction(id: string) {
  const { supabase, userId } = await requireUser()
  await service.updateTask(supabase, userId, id, { status: 'pending' })
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function deleteTaskAction(id: string) {
  const { supabase, userId } = await requireUser()
  await service.deleteTask(supabase, userId, id)
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}
