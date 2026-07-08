import { createClient } from '@/lib/supabase/server'
import { getPrefs, DEFAULT_PREFS } from '@/modules/prefs/service'
import SettingsView from '@/modules/prefs/components/settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const prefs = user ? await getPrefs(supabase, user.id) : DEFAULT_PREFS

  return (
    <SettingsView
      prefs={prefs}
      email={user?.email ?? null}
      fullName={user?.user_metadata?.full_name ?? null}
      avatarUrl={user?.user_metadata?.avatar_url ?? null}
    />
  )
}
