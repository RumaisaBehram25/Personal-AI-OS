import type { SupabaseClient } from '@supabase/supabase-js'
import { startOfDay } from 'date-fns'
import * as taskService from '@/modules/tasks/service'
import * as expenseService from '@/modules/expenses/service'
import * as reminderService from '@/modules/reminders/service'
import * as noteService from '@/modules/notes/service'
import * as prefsService from '@/modules/prefs/service'
import type { Task } from '@/modules/tasks/types'
import type { Expense, SpendingSummary } from '@/modules/expenses/types'
import type { Reminder } from '@/modules/reminders/types'
import type { Note } from '@/modules/notes/types'

export interface TaskStats {
  pending: number
  completedToday: number
  total: number
}

export interface DashboardData {
  currency: string
  stats: TaskStats
  spending: SpendingSummary
  activeReminders: number
  upcomingTasks: Task[]
  recentExpenses: Expense[]
  upcomingReminders: Reminder[]
  recentNotes: Note[]
}

async function countActiveReminders(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('reminders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_sent', false)
    .gte('remind_at', new Date().toISOString())
  if (error) throw new Error(error.message)
  return count ?? 0
}

async function countCompletedToday(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', startOfDay(new Date()).toISOString())
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getTaskStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<TaskStats> {
  const [pending, total, completedToday] = await Promise.all([
    taskService.countTasks(supabase, userId, 'pending'),
    taskService.countTasks(supabase, userId),
    countCompletedToday(supabase, userId),
  ])
  return { pending, total, completedToday }
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardData> {
  const [
    prefs,
    stats,
    spending,
    activeReminders,
    upcomingTasks,
    recentExpenses,
    upcomingReminders,
    recentNotes,
  ] = await Promise.all([
    prefsService.getPrefs(supabase, userId),
    getTaskStats(supabase, userId),
    expenseService.getSpendingSummary(supabase, userId),
    countActiveReminders(supabase, userId),
    taskService.listTasks(supabase, userId, { status: 'pending', limit: 5 }),
    expenseService.listExpenses(supabase, userId, { scope: 'all', limit: 5 }),
    reminderService.listReminders(supabase, userId, {
      upcomingOnly: true,
      limit: 3,
    }),
    noteService.listNotes(supabase, userId, 3),
  ])

  return {
    currency: prefs.currency,
    stats,
    spending: { ...spending, currency: prefs.currency },
    activeReminders,
    upcomingTasks,
    recentExpenses,
    upcomingReminders,
    recentNotes,
  }
}

export interface SummaryFacts {
  currency: string
  timezone: string
  pendingTasks: { title: string; due_at: string | null }[]
  completedToday: number
  todaySpending: number
  weekSpending: number
  topCategory: string | null
  upcomingReminders: { message: string; remind_at: string }[]
}

export async function getSummaryFacts(
  supabase: SupabaseClient,
  userId: string,
): Promise<SummaryFacts> {
  const [prefs, stats, spending, pending, reminders] = await Promise.all([
    prefsService.getPrefs(supabase, userId),
    getTaskStats(supabase, userId),
    expenseService.getSpendingSummary(supabase, userId),
    taskService.listTasks(supabase, userId, { status: 'pending', limit: 8 }),
    reminderService.listReminders(supabase, userId, {
      upcomingOnly: true,
      limit: 5,
    }),
  ])

  return {
    currency: prefs.currency,
    timezone: prefs.timezone,
    pendingTasks: pending.map((t) => ({ title: t.title, due_at: t.due_at })),
    completedToday: stats.completedToday,
    todaySpending: spending.todayTotal,
    weekSpending: spending.weekTotal,
    topCategory: spending.byCategory[0]?.category ?? null,
    upcomingReminders: reminders.map((r) => ({
      message: r.message,
      remind_at: r.remind_at,
    })),
  }
}
