import { createClient } from '@/lib/supabase/server'
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
  let initialMessages: { id: string; role: 'user' | 'assistant'; content: string }[] =
    []

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
      initialMessages = await getConversationMessages(supabase, selectedId)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      <ConversationSidebar conversations={conversations} activeId={selectedId} />
      <div className="min-w-0 flex-1">
        <ChatInterface
          key={selectedId ?? 'new'}
          conversationId={selectedId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  )
}
