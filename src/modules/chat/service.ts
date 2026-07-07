import type { SupabaseClient } from '@supabase/supabase-js'

type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

/**
 * Ensures a conversations row exists. When the client supplies a stable id
 * (generated once per chat session) we upsert it so every message in that
 * session threads into the same conversation. Otherwise a new one is created.
 */
export async function ensureConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string | null | undefined,
  firstUserText?: string,
): Promise<string> {
  const title = firstUserText?.trim().slice(0, 60) || 'New chat'

  if (conversationId) {
    const { error } = await supabase
      .from('conversations')
      .upsert(
        { id: conversationId, user_id: userId, title },
        { onConflict: 'id', ignoreDuplicates: true },
      )
    if (error) throw new Error(error.message)
    return conversationId
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id as string
}

export async function saveMessage(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  role: MessageRole,
  content: string,
  toolCalls?: unknown,
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    tool_calls: toolCalls ?? null,
  })
  if (error) throw new Error(error.message)
}

export interface ConversationSummary {
  id: string
  title: string | null
  updated_at: string
  preview: string | null
}

export async function listConversations(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
): Promise<ConversationSummary[]> {
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)

  const ids = (convos ?? []).map((c) => c.id as string)
  const previewByConvo = new Map<string, string>()

  if (ids.length > 0) {
    const { data: msgs, error: msgError } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', ids)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
    if (msgError) throw new Error(msgError.message)

    for (const m of msgs ?? []) {
      const cid = m.conversation_id as string
      if (!previewByConvo.has(cid)) {
        previewByConvo.set(cid, (m.content as string | null) ?? '')
      }
    }
  }

  return (convos ?? []).map((c) => ({
    id: c.id as string,
    title: c.title as string | null,
    updated_at: c.updated_at as string,
    preview: previewByConvo.get(c.id as string) ?? null,
  }))
}

export async function deleteConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userId)
    .eq('id', conversationId)
  if (error) throw new Error(error.message)
}

export async function getLatestConversationId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.id as string) ?? null
}

export async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)

  return (data ?? []).map((m) => ({
    id: m.id as string,
    role: m.role as 'user' | 'assistant',
    content: (m.content as string | null) ?? '',
    createdAt: m.created_at as string,
  }))
}
