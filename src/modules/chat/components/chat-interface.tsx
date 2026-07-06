'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat, type Message } from '@ai-sdk/react'
import { Send, Sparkles, Loader2, Wrench, User } from 'lucide-react'

const SUGGESTIONS = [
  'I spent $15 on lunch',
  'Remind me to call John tomorrow',
  'What tasks do I have today?',
  'Summarize my spending this week',
]

interface ChatInterfaceProps {
  conversationId: string | null
  initialMessages: Message[]
}

export default function ChatInterface({
  conversationId,
  initialMessages,
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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col bg-[#f1f5f9]">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#e2e8f0] bg-[#f1f5f9]/92 px-4 py-4 backdrop-blur-md md:px-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[#6366f1]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#0f172a]">
            Assistant
          </h1>
          <p className="text-xs text-[#64748b]">
            Ask me to manage tasks and expenses
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          {isEmpty && (
            <div className="mt-10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366f1] text-white shadow-lg">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-[#0f172a]">
                How can I help?
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">
                Try one of these to get started:
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

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role !== 'user' && (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10 text-[#6366f1]">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  message.role === 'user'
                    ? 'bg-[#6366f1] text-white'
                    : 'border border-[#e9eef5] bg-white text-[#0f172a]'
                }`}
              >
                {message.content && (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}

                {message.toolInvocations?.map((tool) => (
                  <div
                    key={tool.toolCallId}
                    className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#6366f1]/[0.06] px-2.5 py-1.5 text-xs font-medium text-[#6366f1]"
                  >
                    {tool.state === 'result' ? (
                      <Wrench className="h-3.5 w-3.5" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    <span>
                      {tool.state === 'result' ? 'Done: ' : 'Running: '}
                      {tool.toolName}
                    </span>
                  </div>
                ))}
              </div>

              {message.role === 'user' && (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0f172a]/5 text-[#334155]">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

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
      <div className="sticky bottom-0 border-t border-[#e2e8f0] bg-white px-4 py-4 md:px-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl items-end gap-2"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Message the assistant…"
            className="flex-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:bg-white"
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
