export type ReminderChannel = 'in_app' | 'email'

export interface Reminder {
  id: string
  user_id: string
  task_id: string | null
  message: string
  remind_at: string
  is_sent: boolean
  channel: ReminderChannel
  created_at: string
}

export interface CreateReminderInput {
  message: string
  remindAt: string
  taskId?: string | null
  channel?: ReminderChannel
}

export interface ListRemindersFilters {
  upcomingOnly?: boolean
  limit?: number
}
