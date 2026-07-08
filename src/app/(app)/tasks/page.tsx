import { createClient } from '@/lib/supabase/server'
import { listTasks } from '@/modules/tasks/service'
import TasksView from '@/modules/tasks/components/tasks-view'

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const tasks = user
    ? await listTasks(supabase, user.id, { scope: 'all' })
    : []

  return <TasksView tasks={tasks} />
}
