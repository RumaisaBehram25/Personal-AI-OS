'use client'

import { MessageSquare, CheckSquare, Receipt, FileText } from 'lucide-react'

interface QuickActionsProps {
  isLoading?: boolean
}

export default function QuickActions({ isLoading = false }: QuickActionsProps) {
  const actions = [
    { label: 'Chat with AI', icon: MessageSquare, href: '/chat' },
    { label: 'Add Task', icon: CheckSquare, href: '/tasks' },
    { label: 'Log Expense', icon: Receipt, href: '/expenses' },
    { label: 'New Note', icon: FileText, href: '/notes' },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-white rounded-lg border border-[#e9eef5] shadow-sm animate-pulse flex items-center justify-center p-3"
          >
            <div className="h-4 w-5 bg-slate-200 rounded mr-2" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      {actions.map((action, i) => {
        const Icon = action.icon
        return (
          <a
            key={i}
            href={action.href}
            className="flex items-center justify-center gap-2.5 h-12 bg-white border border-[#6366f1] text-[#6366f1] rounded-lg text-sm font-semibold shadow-sm hover:bg-[#6366f1]/[0.08] hover:border-[#4f46e5] hover:text-[#4f46e5] transition-all duration-150 active:scale-[0.98]"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{action.label}</span>
          </a>
        )
      })}
    </div>
  )
}
