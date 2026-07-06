import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, getPlatformMetrics } from '@/modules/admin/service'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const metrics = await getPlatformMetrics()
  return NextResponse.json(metrics)
}
