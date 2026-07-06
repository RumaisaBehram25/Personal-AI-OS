import Link from 'next/link'
import {
  Receipt,
  Utensils,
  Car,
  CreditCard,
  ShoppingBag,
  ChevronRight,
  PieChart,
} from 'lucide-react'
import { formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'
import type { Expense, SpendingSummary } from '@/modules/expenses/types'

const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-[#6366f1]',
  transport: 'bg-[#0891b2]',
  bills: 'bg-[#dc2626]',
  shopping: 'bg-[#d97706]',
  entertainment: 'bg-[#16a34a]',
  health: 'bg-[#db2777]',
  other: 'bg-[#64748b]',
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'food':
      return Utensils
    case 'transport':
      return Car
    case 'bills':
      return CreditCard
    case 'shopping':
      return ShoppingBag
    default:
      return Receipt
  }
}

function timeAgo(value: string): string {
  const d = parseISO(value)
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ''
}

export default function RecentExpenses({
  expenses,
  summary,
}: {
  expenses: Expense[]
  summary: SpendingSummary
}) {
  const total = summary.byCategory.reduce((acc, c) => acc + c.total, 0)

  return (
    <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full transition-all duration-250 hover:shadow-md hover:border-[#6366f1]/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
          <Receipt className="h-4.5 w-4.5 text-[#6366f1]" />
          <span>Recent Expenses &amp; Breakdown</span>
        </h3>
        <Link
          href="/expenses"
          className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {expenses.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#94a3b8]">
          No expenses logged yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-2.5">
            {expenses.map((expense) => {
              const Icon = getCategoryIcon(expense.category)
              return (
                <div
                  key={expense.id}
                  className="group flex items-center justify-between p-3 bg-[#fafbfc] border border-[#f1f5f9] hover:border-[#6366f1]/20 hover:bg-[#6366f1]/[0.02] rounded-md transition-all duration-150"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm shrink-0',
                        CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.other,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#6366f1] transition-colors">
                        {expense.description || expense.category}
                      </span>
                      <span className="block text-[10px] text-[#94a3b8] font-medium uppercase tracking-wide">
                        {timeAgo(expense.spent_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#0f172a] whitespace-nowrap">
                    -{formatMoney(expense.amount, expense.currency)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-[#e2e8f0] pt-5 md:pt-0 md:pl-5 flex flex-col justify-center">
            <h4 className="text-xs font-bold text-[#64748b] tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5 text-[#6366f1]" />
              Category Share
            </h4>
            {summary.byCategory.length === 0 ? (
              <p className="text-xs text-[#94a3b8]">No spending this week.</p>
            ) : (
              <div className="space-y-3.5">
                {summary.byCategory.slice(0, 5).map((item) => {
                  const CatIcon = getCategoryIcon(item.category)
                  const percentage =
                    total > 0 ? Math.round((item.total / total) * 100) : 0
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-[#0f172a] capitalize">
                          <CatIcon className="h-3.5 w-3.5 text-[#6366f1]" />
                          <span>{item.category}</span>
                        </div>
                        <span className="text-[#64748b]">
                          {formatMoney(item.total, summary.currency)} ({percentage}
                          %)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            CATEGORY_COLORS[item.category] ??
                              CATEGORY_COLORS.other,
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
