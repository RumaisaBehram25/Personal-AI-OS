import { streamText, convertToCoreMessages, type Message } from 'ai'
import { openai } from '@ai-sdk/openai'
import { AI_MODEL } from '@/config/constants'
import { createClient } from '@/lib/supabase/server'
import { buildTools } from '@/modules/chat/tools/registry'
import { buildSystemPrompt } from '@/modules/chat/prompt'
import { ensureConversation, saveMessage } from '@/modules/chat/service'
import {
  RECENT_WINDOW,
  buildActiveStateBlock,
  getConversationSummary,
  maybeSummarize,
} from '@/modules/chat/memory'
import { getPrefs } from '@/modules/prefs/service'

export const maxDuration = 30

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = (await req.json()) as {
    messages?: Message[]
    conversationId?: string | null
  }
  const messages = body.messages ?? []

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const lastUserText =
    typeof lastUser?.content === 'string' ? lastUser.content : undefined

  const conversationId = await ensureConversation(
    supabase,
    user.id,
    body.conversationId,
    lastUserText,
  )

  if (lastUserText) {
    await saveMessage(supabase, user.id, conversationId, 'user', lastUserText)
  }

  const userName =
    (user.user_metadata?.full_name as string | undefined) ?? null

  // Assemble the bounded context:
  //   system prompt  ->  compressed summary  ->  active state  ->  last K msgs
  const [prefs, summary, activeState] = await Promise.all([
    getPrefs(supabase, user.id),
    getConversationSummary(supabase, conversationId),
    buildActiveStateBlock(supabase, user.id),
  ])

  const systemParts = [
    buildSystemPrompt({ now: new Date(), userName, currency: prefs.currency }),
  ]
  if (summary) {
    systemParts.push(
      `\nSummary of earlier messages in this conversation (older context, compressed):\n${summary}`,
    )
  }
  systemParts.push(`\n${activeState}`)
  const system = systemParts.join('\n')

  // Only the most recent messages go to the model verbatim; older context is
  // carried by the summary above, keeping the token cost flat.
  const recentMessages = messages.slice(-RECENT_WINDOW)

  const result = streamText({
    model: openai(AI_MODEL),
    system,
    messages: convertToCoreMessages(recentMessages),
    tools: buildTools({ supabase, userId: user.id, conversationId }),
    maxSteps: 5,
    onFinish: async ({ text }) => {
      if (text) {
        await saveMessage(supabase, user.id, conversationId, 'assistant', text)
      }
      // Fold anything that has aged out of the window into the rolling summary.
      await maybeSummarize(supabase, conversationId)
    },
  })

  return result.toDataStreamResponse({
    headers: { 'x-conversation-id': conversationId },
  })
}
