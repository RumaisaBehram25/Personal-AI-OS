'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Plus, MessageSquare, Trash2, History, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deleteConversationAction } from '../actions'
import type { ConversationSummary } from '../service'

interface Props {
  conversations: ConversationSummary[]
  activeId: string | null
}

export default function ConversationSidebar({ conversations, activeId }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteConversationAction(id)
      } catch {
        // redirect() throws internally; ignore.
      }
    })
  }

  const panel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-3 pt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
          Chats
        </span>
        <button
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Link
        href="/chat?new=1"
        onClick={() => setOpen(false)}
        className="mx-3 mb-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4f46e5]"
      >
        <Plus className="h-4 w-4" />
        New chat
      </Link>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 && (
          <p className="px-3 py-4 text-xs text-[#94a3b8]">No conversations yet.</p>
        )}
        {conversations.map((c) => {
          const isActive = c.id === activeId
          return (
            <div
              key={c.id}
              className={cn(
                'group flex items-center gap-1 rounded-lg pr-1 transition-colors',
                isActive ? 'bg-[#6366f1]/[0.08]' : 'hover:bg-[#f1f5f9]',
              )}
            >
              <Link
                href={`/chat?c=${c.id}`}
                onClick={() => setOpen(false)}
                className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2"
              >
                <MessageSquare
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-[#6366f1]' : 'text-[#94a3b8]',
                  )}
                />
                <span
                  className={cn(
                    'truncate text-sm',
                    isActive
                      ? 'font-medium text-[#6366f1]'
                      : 'text-[#334155]',
                  )}
                >
                  {c.title || 'New chat'}
                </span>
              </Link>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={isPending}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#94a3b8] opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                title="Delete conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop column */}
      <aside className="hidden w-[260px] shrink-0 border-r border-[#e2e8f0] bg-white md:block">
        {panel}
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1] text-white shadow-lg md:hidden"
        title="Chat history"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <History className="h-5 w-5" />
        )}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[80%] max-w-[300px] bg-white shadow-xl">
            {panel}
          </div>
        </div>
      )}
    </>
  )
}
