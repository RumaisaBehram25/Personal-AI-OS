import type { TaskStatus } from '@/config/constants'

export type { TaskStatus }

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  due_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  dueAt?: string | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  dueAt?: string | null
}

export type TaskScope = 'today' | 'upcoming' | 'overdue' | 'all'

export interface ListTasksFilters {
  status?: TaskStatus
  scope?: TaskScope
  limit?: number
}
