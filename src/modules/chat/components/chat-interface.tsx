'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useChat, type Message } from '@ai-sdk/react'
import {
  Send,
  Sparkles,
  Loader2,
  Settings2,
  Plus,
  Download,
  Trash2,
} from 'lucide-react'
import { format, isValid, isToday, isYesterday } from 'date-fns'
import { deleteConversationAction } from '../actions'
import ToolResultCards from './tool-result-cards'

const SUGGESTIONS = [
  'Add a task for tomorrow',
  'Log $12 for lunch',
  'What did I spend this week?',
  'Remind me to call John at 5pm',
]

const TOOL_LABELS: Record<string, string> = {
  createTask: 'Creating task…',
  listTasks: 'Checking your tasks…',
  updateTask: 'Updating task…',
  completeTask: 'Completing task…',
  logExpense: 'Logging expense…',
  listExpenses: 'Checking your expenses…',
  summarizeSpending: 'Summarizing spending…',
  createReminder: 'Setting reminder…',
  updateReminder: 'Updating reminder…',
  listReminders: 'Checking your reminders…',
  createNote: 'Saving note…',
  listNotes: 'Checking your notes…',
  getUserContext: 'Loading your info…',
  getDailySummary: 'Building your summary…',
}

function toolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? 'Working…'
}

function formatTime(date: Date | undefined): string {
  if (!date || !isValid(date)) return ''
  return format(date, 'h:mm a')
}

function dividerLabel(date: Date): string {
  if (isToday(date)) return `Today · ${format(date, 'MMMM d, yyyy')}`
  if (isYesterday(date)) return `Yesterday · ${format(date, 'MMMM d, yyyy')}`
  return format(date, 'EEEE · MMMM d, yyyy')
}

function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function downloadTranscript(messages: Message[]) {
  const lines = messages.map((m) => {
    const who = m.role === 'user' ? 'You' : 'HypoOS'
    const time = formatTime(m.createdAt)
    return `[${time}] ${who}: ${m.content}`
  })
  const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hypoos-chat-${format(new Date(), 'yyyy-MM-dd')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const MAX_TEXTAREA_HEIGHT = 128 // px, ~5 rows

interface ChatInterfaceProps {
  conversationId: string | null
  initialMessages: Message[]
  userInitials: string
}

export default function ChatInterface({
  conversationId,
  initialMessages,
  userInitials,
}: ChatInterfaceProps) {
  // Stable conversation id for this session so every turn threads together.
  const [convId] = useState(
    () => conversationId ?? globalThis.crypto?.randomUUID?.() ?? '',
  )

  const { messages, input, handleInputChange, handleSubmit, status, error, append } =
    useChat({
      api: '/api/chat',
      initialMessages,
      body: { conversationId: convId },
    })

  const isBusy = status === 'submitted' || status === 'streaming'
  const [isDeleting, startDelete] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    if (input === '') {
      el.style.height = 'auto'
      return
    }
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isBusy && input.trim()) formRef.current?.requestSubmit()
    }
  }

  const handleDeleteConversation = () => {
    if (!conversationId) return
    startDelete(async () => {
      try {
        await deleteConversationAction(conversationId)
      } catch {
        // redirect() throws internally; ignore.
      }
    })
  }

  const isEmpty = messages.length === 0
  let lastDayKey: string | null = null

  return (
    <div className="flex h-full flex-col bg-[#f1f5f9]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-[#e2e8f0] bg-[rgba(241,245,249,0.92)] px-4 py-4 backdrop-blur-md md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[#6366f1]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-[#0f172a]">
              Chat with HypoOS
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16a34a]" />
              Ask me to manage tasks and expenses
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden rounded-full bg-[#6366f1]/10 px-2.5 py-1 text-xs font-semibold text-[#6366f1] sm:inline-block">
            HypoOS AI
          </span>
          <button
            onClick={() => downloadTranscript(messages)}
            disabled={isEmpty}
            title="Download transcript"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#6366f1]/10 hover:text-[#6366f1] disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleDeleteConversation}
            disabled={!conversationId || isDeleting}
            title="Delete conversation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
          <Link
            href="/chat?new=1"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4f46e5]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-4 md:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          {isEmpty && (
            <div className="mt-10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6366f1] text-white shadow-lg">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-[#0f172a]">
                What can I help you with?
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">
                I can manage your tasks, log expenses, take notes, and set reminders.
              </p>
              <div className="mt-5 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => append({ role: 'user', content: s })}
                    disabled={isBusy}
                    className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-left text-sm font-medium text-[#334155] shadow-sm transition-all hover:border-[#6366f1]/40 hover:bg-[#6366f1]/[0.03] disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => {
            const isUser = message.role === 'user'
            const isLast = i === messages.length - 1
            const isStreamingThis = isLast && !isUser && status === 'streaming'
            const pendingTools = message.toolInvocations?.filter((t) => t.state !== 'result') ?? []

            const msgDate = message.createdAt
            let showDivider = false
            if (msgDate && isValid(msgDate)) {
              const key = dayKey(msgDate)
              if (key !== lastDayKey) {
                showDivider = true
                lastDayKey = key
              }
            }

            return (
              <div key={message.id}>
                {showDivider && msgDate && (
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#e2e8f0]" />
                    <span className="shrink-0 text-xs font-medium text-[#94a3b8]">
                      {dividerLabel(msgDate)}
                    </span>
                    <div className="h-px flex-1 bg-[#e2e8f0]" />
                  </div>
                )}

                <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[#6366f1]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`flex max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'rounded-br-sm bg-[#6366f1] text-white'
                          : 'rounded-bl-sm border border-[#e9eef5] bg-white text-[#0f172a]'
                      }`}
                    >
                      {message.content && (
                        <p className="whitespace-pre-wrap">
                          {message.content}
                          {isStreamingThis && (
                            <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-current align-middle" />
                          )}
                        </p>
                      )}

                      {pendingTools.map((tool) => (
                        <div
                          key={tool.toolCallId}
                          className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#6366f1]/[0.06] px-2.5 py-1.5 text-xs font-medium text-[#6366f1]"
                        >
                          <Settings2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{toolLabel(tool.toolName)}</span>
                        </div>
                      ))}

                      {!isUser && message.toolInvocations && (
                        <ToolResultCards toolInvocations={message.toolInvocations} />
                      )}
                    </div>
                    <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-[#94a3b8]">
                      {formatTime(message.createdAt)}
                      {isUser && message.createdAt && ' · delivered'}
                    </span>
                  </div>

                  {isUser && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/10 text-xs font-semibold text-[#6366f1]">
                      {userInitials}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {status === 'submitted' && (
            <div className="flex items-center gap-2 text-sm text-[#64748b]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Something went wrong. Please try again.
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 shrink-0 border-t border-[#e2e8f0] bg-white px-4 py-4 md:px-8">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message the assistant… (Enter to send, Shift+Enter for a new line)"
            className="flex-1 resize-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:bg-white"
            style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
            disabled={isBusy}
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-[#6366f1] text-white shadow-sm transition-all hover:bg-[#4f46e5] active:scale-95 disabled:opacity-40"
          >
            {isBusy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
