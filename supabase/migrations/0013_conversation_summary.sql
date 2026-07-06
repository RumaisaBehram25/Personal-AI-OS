-- =====================================================================
-- 0013_conversation_summary
-- Rolling memory for chats: a compressed summary of older messages plus a
-- marker of how far the summary covers, so the assistant keeps context
-- without sending the whole transcript to the model.
-- =====================================================================

alter table public.conversations
  add column if not exists summary text,
  add column if not exists summary_through timestamptz;
