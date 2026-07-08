import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { AI_MODEL } from '@/config/constants'
import { createClient } from '@/lib/supabase/server'
import { getSummaryFacts } from '@/modules/dashboard/service'

export const maxDuration = 30

function formatWhen(iso: string | null, timeZone: string): string {
  if (!iso) return 'no due date'
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

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const facts = await getSummaryFacts(supabase, user.id)
  const tz = facts.timezone || 'UTC'
  const userName =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? null

  const nowStr = formatWhen(new Date().toISOString(), tz)

  const taskLines = facts.pendingTasks.length
    ? facts.pendingTasks
        .map((t) => `- ${t.title} (due: ${formatWhen(t.due_at, tz)})`)
        .join('\n')
    : '- none'

  const reminderLines = facts.upcomingReminders.length
    ? facts.upcomingReminders
        .map((r) => `- ${r.message} (at: ${formatWhen(r.remind_at, tz)})`)
        .join('\n')
    : '- none'

  const prompt = [
    'You are writing a short, friendly daily briefing (2-4 sentences) for a personal productivity app.',
    userName ? `The user is ${userName}.` : '',
    `The current date and time is ${nowStr} (timezone ${tz}).`,
    '',
    'Pending tasks (with due dates):',
    taskLines,
    '',
    'Upcoming reminders:',
    reminderLines,
    '',
    `Spent today: ${facts.todaySpending} ${facts.currency}. Spent this week: ${facts.weekSpending} ${facts.currency}.`,
    `Tasks completed today: ${facts.completedToday}.`,
    facts.topCategory ? `Top spending category: ${facts.topCategory}.` : '',
    '',
    'Instructions:',
    '- Explicitly mention any tasks or meetings due today or tomorrow BY NAME, and say when they are due (e.g. "tomorrow at 3 PM").',
    '- Mention upcoming reminders by name if there are any.',
    '- Briefly note spending.',
    '- Be encouraging and concise. Plain text only, no markdown or bullet points. Address the user directly.',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const { text } = await generateText({
      model: openai(AI_MODEL),
      prompt,
    })
    return Response.json({ summary: text, facts })
  } catch {
    const taskNames = facts.pendingTasks.map((t) => t.title).join(', ') || 'none'
    const fallback = `You have ${facts.pendingTasks.length} pending task${
      facts.pendingTasks.length === 1 ? '' : 's'
    } (${taskNames}) and completed ${facts.completedToday} today. You've spent ${facts.todaySpending} ${facts.currency} today and ${facts.weekSpending} ${facts.currency} this week.`
    return Response.json({ summary: fallback, facts })
  }
}
