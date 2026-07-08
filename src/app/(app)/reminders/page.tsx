import { createClient } from '@/lib/supabase/server'
import { listReminders } from '@/modules/reminders/service'
import RemindersView from '@/modules/reminders/components/reminders-view'

export default async function RemindersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const reminders = user ? await listReminders(supabase, user.id) : []

  return <RemindersView reminders={reminders} />
}
