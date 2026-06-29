/** The OpenAI model used by the assistant (cheap + fast, per the brief). */
export const AI_MODEL = 'gpt-4o-mini'

/** App route paths, kept in one place to avoid magic strings. */
export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  signUp: '/sign-up',
  dashboard: '/dashboard',
  chat: '/chat',
  tasks: '/tasks',
  expenses: '/expenses',
  notes: '/notes',
  reminders: '/reminders',
  profile: '/profile',
  settings: '/settings',
  admin: '/admin',
} as const

/** Default expense categories for manual entry and AI categorisation. */
export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'health',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

/** Task status values. */
export const TASK_STATUSES = ['pending', 'completed'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
