import type { Message } from '@ai-sdk/react'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import {
  getLatestConversationId,
  getConversationMessages,
  listConversations,
} from '@/modules/chat/service'
import ChatInterface from '@/modules/chat/components/chat-interface'
import ConversationSidebar from '@/modules/chat/components/conversation-sidebar'

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; new?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let conversations: Awaited<ReturnType<typeof listConversations>> = []
  let selectedId: string | null = null
  let initialMessages: Message[] = []

  if (user) {
    conversations = await listConversations(supabase, user.id)

    if (params.new) {
      selectedId = null
    } else if (params.c) {
      selectedId = params.c
    } else {
      selectedId = await getLatestConversationId(supabase, user.id)
    }

    if (selectedId) {
      const stored = await getConversationMessages(supabase, selectedId)
      initialMessages = stored.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt),
      }))
    }
  }

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'You'
  const userInitials = getInitials(displayName)

  return (
    <div className="flex h-[calc(100vh-8.5rem)] md:h-screen">
      <ConversationSidebar conversations={conversations} activeId={selectedId} />
      <div className="min-w-0 flex-1">
        <ChatInterface
          key={selectedId ?? 'new'}
          conversationId={selectedId}
          initialMessages={initialMessages}
          userInitials={userInitials}
        />
      </div>
    </div>
  )
}
