import { createClient } from '@/lib/supabase/server'
import { listNotes } from '@/modules/notes/service'
import NotesView from '@/modules/notes/components/notes-view'

export default async function NotesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const notes = user ? await listNotes(supabase, user.id) : []

  return <NotesView notes={notes} />
}
