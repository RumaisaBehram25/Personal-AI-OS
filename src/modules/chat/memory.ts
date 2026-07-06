import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_MODEL } from '@/config/constants'
import * as taskService from '@/modules/tasks/service'
import * as reminderService from '@/modules/reminders/service'
import { getPrefs } from '@/modules/prefs/service'

/** Number of most recent messages sent to the model verbatim. */
export const RECENT_WINDOW = 10

/** Only start summarizing once a conversation grows past this many messages. */
const SUMMARY_TRIGGER = RECENT_WINDOW + 6

/** Hard cap on messages scanned per summarization pass. */
const SCAN_LIMIT = 400

interface RawMessage {
  role: string
  content: string | null
  created_at: string
}

/** Formats an ISO timestamp in the user's timezone for model-readable context. */
function formatLocal(iso: string | null, timeZone: string): string {
  if (!iso) return 'no time set'
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/**
 * Builds the compact "current state" block injected right before the newest
 * user message: open tasks (with ids so the model can act on "the first one"),
 * upcoming reminders, and the user's currency. Kept small on purpose.
 */
export async function buildActiveStateBlock(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const [tasks, reminders, prefs] = await Promise.all([
    taskService.listTasks(supabase, userId, { status: 'pending', limit: 10 }),
    reminderService.listReminders(supabase, userId, {
      upcomingOnly: true,
      limit: 5,
    }),
    getPrefs(supabase, userId),
  ])

  const tz = prefs.timezone || 'UTC'
  const lines: string[] = [
    `Current state (for your reference; times shown in the user's timezone ${tz}):`,
  ]

  if (tasks.length) {
    lines.push('Pending tasks:')
    for (const t of tasks) {
      lines.push(
        `- [${t.id}] ${t.title}${
          t.due_at ? ` (due: ${formatLocal(t.due_at, tz)})` : ''
        }`,
      )
    }
  } else {
    lines.push('Pending tasks: none')
  }

  if (reminders.length) {
    lines.push('Upcoming reminders:')
    for (const r of reminders) {
      lines.push(`- ${r.message} (at: ${formatLocal(r.remind_at, tz)})`)
    }
  } else {
    lines.push('Upcoming reminders: none')
  }

  lines.push(`Currency: ${prefs.currency}. Timezone: ${tz}.`)

  return lines.join('\n')
}

export async function getConversationSummary(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('summary')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) return null
  return (data?.summary as string | null) ?? null
}

async function summarize(
  oldSummary: string | null,
  messages: RawMessage[],
): Promise<string | null> {
  const transcript = messages
    .map((m) => `${m.role}: ${m.content ?? ''}`)
    .join('\n')

  const prompt = [
    'You maintain a running summary of a conversation between a user and their personal assistant.',
    '',
    `Existing summary:\n${oldSummary?.trim() || '(none yet)'}`,
    '',
    `New messages to fold into the summary:\n${transcript}`,
    '',
    'Update the summary so it captures the important, durable information: decisions made, user preferences, facts (names, dates, amounts), and any unresolved or pending threads. Drop small talk. Keep it under 200 words and write it as concise notes. Output ONLY the updated summary text.',
  ].join('\n')

  try {
    const { text } = await generateText({ model: openai(AI_MODEL), prompt })
    return text.trim() || oldSummary
  } catch {
    // Never lose the existing summary on failure.
    return oldSummary
  }
}

/**
 * Folds messages that have aged out of the recent window into the rolling
 * summary. Idempotent via `summary_through`: each message is summarized once.
 * Safe to call after every assistant reply; it no-ops until the trigger.
 */
export async function maybeSummarize(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<void> {
  try {
    const { data: convo } = await supabase
      .from('conversations')
      .select('summary, summary_through')
      .eq('id', conversationId)
      .maybeSingle()

    const oldSummary = (convo?.summary as string | null) ?? null
    const summaryThrough = (convo?.summary_through as string | null) ?? null

    const { data: rows, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(SCAN_LIMIT)
    if (error || !rows) return

    const messages = rows as RawMessage[]
    if (messages.length < SUMMARY_TRIGGER) return

    // Everything except the most recent window is eligible for summarizing.
    const older = messages.slice(0, messages.length - RECENT_WINDOW)
    const toFold = summaryThrough
      ? older.filter((m) => m.created_at > summaryThrough)
      : older
    if (toFold.length === 0) return

    const newSummary = await summarize(oldSummary, toFold)
    if (!newSummary) return

    await supabase
      .from('conversations')
      .update({
        summary: newSummary,
        summary_through: toFold[toFold.length - 1].created_at,
      })
      .eq('id', conversationId)
  } catch {
    // Summarization must never break the chat.
  }
}
