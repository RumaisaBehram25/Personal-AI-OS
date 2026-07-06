import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export interface RecentUser {
  email: string | null
  full_name: string | null
  created_at: string
}

export interface PlatformMetrics {
  totalUsers: number
  totalTasks: number
  completedTasks: number
  totalExpenses: number
  expenseAmount: number
  totalMessages: number
  totalConversations: number
  toolCalls: number
  recentUsers: RecentUser[]
}

/**
 * Checks whether a user has the admin role. Uses the caller's (user-scoped)
 * client so it respects RLS — a user can always read their own users row.
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (error) return false
  return data?.role === 'admin'
}

async function count(admin: SupabaseClient, table: string): Promise<number> {
  const { count: c, error } = await admin
    .from(table)
    .select('id', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return c ?? 0
}

async function countCompletedTasks(admin: SupabaseClient): Promise<number> {
  const { count: c, error } = await admin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')
  if (error) throw new Error(error.message)
  return c ?? 0
}

/**
 * Aggregates platform-wide metrics across all users. Uses the service-role
 * client to bypass RLS. Must only be called after an admin check.
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const admin = createAdminClient()

  const [
    totalUsers,
    totalTasks,
    completedTasks,
    totalExpenses,
    totalMessages,
    totalConversations,
    toolCalls,
    amountsRes,
    recentRes,
  ] = await Promise.all([
    count(admin, 'users'),
    count(admin, 'tasks'),
    countCompletedTasks(admin),
    count(admin, 'expenses'),
    count(admin, 'messages'),
    count(admin, 'conversations'),
    count(admin, 'exec_logs'),
    admin.from('expenses').select('amount'),
    admin
      .from('users')
      .select('email, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const expenseAmount = (amountsRes.data ?? []).reduce(
    (sum: number, row: { amount: unknown }) => {
      const n =
        typeof row.amount === 'string'
          ? parseFloat(row.amount)
          : Number(row.amount)
      return sum + (Number.isFinite(n) ? n : 0)
    },
    0,
  )

  return {
    totalUsers,
    totalTasks,
    completedTasks,
    totalExpenses,
    expenseAmount,
    totalMessages,
    totalConversations,
    toolCalls,
    recentUsers: (recentRes.data ?? []) as RecentUser[],
  }
}
