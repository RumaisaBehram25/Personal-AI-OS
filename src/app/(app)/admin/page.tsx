import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, getPlatformMetrics } from '@/modules/admin/service'
import AdminView from '@/modules/admin/components/admin-view'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f1f5f9] p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-[#0f172a]">Access denied</h1>
        <p className="max-w-sm text-sm text-[#64748b]">
          This area is for administrators only. If you believe this is a mistake,
          ask an admin to grant your account the admin role.
        </p>
      </div>
    )
  }

  const metrics = await getPlatformMetrics()
  return <AdminView metrics={metrics} />
}
