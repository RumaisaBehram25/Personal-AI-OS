'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Plus, MessageSquare, Trash2, History, X, Loader2, Search } from 'lucide-react'
import { format, isValid, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import { deleteConversationAction } from '../actions'
import type { ConversationSummary } from '../service'

interface Props {
  conversations: ConversationSummary[]
  activeId: string | null
}

type DateGroup = 'Today' | 'Yesterday' | 'This week' | 'Earlier'
const DATE_GROUP_ORDER: DateGroup[] = ['Today', 'Yesterday', 'This week', 'Earlier']

function dateGroupOf(updatedAt: string): DateGroup {
  const d = parseISO(updatedAt)
  if (!isValid(d)) return 'Earlier'
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isThisWeek(d, { weekStartsOn: 1 })) return 'This week'
  return 'Earlier'
}

function formatTimestamp(updatedAt: string): string {
  const d = parseISO(updatedAt)
  if (!isValid(d)) return ''
  return isThisWeek(d, { weekStartsOn: 1 }) ? format(d, 'h:mm a') : format(d, 'MMM d')
}

export default function ConversationSidebar({ conversations, activeId }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const mostRecentId = conversations[0]?.id ?? null

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) =>
        (c.title ?? 'New chat').toLowerCase().includes(q) ||
        c.preview?.toLowerCase().includes(q),
    )
  }, [conversations, search])

  const grouped = DATE_GROUP_ORDER.map((group) => ({
    group,
    items: filtered.filter((c) => dateGroupOf(c.updated_at) === group),
  })).filter((g) => g.items.length > 0)

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
        <div className="flex items-center gap-1">
          <Link
            href="/chat?new=1"
            onClick={() => setOpen(false)}
            title="New chat"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] transition-colors hover:bg-[#6366f1]/10 hover:text-[#6366f1]"
          >
            <Plus className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link
        href="/chat?new=1"
        onClick={() => setOpen(false)}
        className="mx-3 mb-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4f46e5]"
      >
        <Plus className="h-4 w-4" />
        New chat
      </Link>

      <div className="relative mx-3 mb-3">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats…"
          className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] py-2 pl-8 pr-3 text-xs outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 && (
          <p className="px-3 py-4 text-xs text-[#94a3b8]">No conversations yet.</p>
        )}
        {conversations.length > 0 && filtered.length === 0 && (
          <p className="px-3 py-4 text-xs text-[#94a3b8]">No chats match your search.</p>
        )}

        {grouped.map(({ group, items }) => (
          <div key={group} className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
              {group}
            </p>
            {items.map((c) => {
              const isActive = c.id === activeId
              const isMostRecent = c.id === mostRecentId
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
                    className="flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2"
                  >
                    <MessageSquare
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        isActive ? 'text-[#6366f1]' : 'text-[#94a3b8]',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm',
                          isActive ? 'font-medium text-[#6366f1]' : 'font-medium text-[#334155]',
                        )}
                      >
                        {c.title || 'New chat'}
                      </span>
                      {c.preview && (
                        <span className="block truncate text-xs text-[#94a3b8]">
                          {c.preview}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 pl-1">
                      <span className="text-[10px] text-[#94a3b8]">
                        {formatTimestamp(c.updated_at)}
                      </span>
                      {isMostRecent && <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />}
                    </div>
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
        ))}
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
