'use client'

import { Receipt, Utensils, Car, CreditCard, ShoppingBag, ChevronRight, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentExpensesProps {
  isLoading?: boolean
}

const EXPENSES = [
  {
    id: 1,
    title: 'Lunch at cafe',
    category: 'food',
    amount: 24.00,
    timeAgo: '1 hour ago',
  },
  {
    id: 2,
    title: 'Uber ride to office',
    category: 'transport',
    amount: 12.00,
    timeAgo: '3 hours ago',
  },
  {
    id: 3,
    title: 'Morning Espresso',
    category: 'food',
    amount: 4.50,
    timeAgo: '5 hours ago',
  },
  {
    id: 4,
    title: 'AWS server hosting',
    category: 'bills',
    amount: 15.00,
    timeAgo: 'Yesterday',
  },
  {
    id: 5,
    title: 'Book store purchase',
    category: 'shopping',
    amount: 18.99,
    timeAgo: '2 days ago',
  },
]

const BREAKDOWN = [
  { category: 'food', amount: 28.50, color: 'bg-[#6366f1]', textColor: 'text-[#6366f1]', icon: Utensils },
  { category: 'transport', amount: 12.00, color: 'bg-[#0891b2]', textColor: 'text-[#0891b2]', icon: Car },
  { category: 'bills', amount: 15.00, color: 'bg-[#dc2626]', textColor: 'text-[#dc2626]', icon: CreditCard },
  { category: 'shopping', amount: 18.99, color: 'bg-[#d97706]', textColor: 'text-[#d97706]', icon: ShoppingBag },
]

export default function RecentExpenses({ isLoading = false }: RecentExpensesProps) {
  const getCategoryIcon = (category: string) => {
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

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'food':
        return 'text-[#6366f1] bg-[#6366f1]/10'
      case 'transport':
        return 'text-[#0891b2] bg-[#0891b2]/10'
      case 'bills':
        return 'text-[#dc2626] bg-[#dc2626]/10'
      case 'shopping':
        return 'text-[#d97706] bg-[#d97706]/10'
      default:
        return 'text-[#64748b] bg-[#64748b]/10'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full animate-pulse">
        <div className="flex justify-between items-center mb-5">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[#fafbfc] border border-[#f1f5f9] rounded-md h-[54px]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-4.5 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-4.5 w-12 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-[#e9eef5] pt-4 md:pt-0 md:pl-4 space-y-4">
            <div className="h-4 w-28 bg-slate-200 rounded mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="h-3.5 w-16 bg-slate-200 rounded" />
                    <div className="h-3.5 w-10 bg-slate-200 rounded" />
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#e9eef5] rounded-lg shadow-sm p-5 md:p-6 w-full transition-all duration-250 hover:shadow-md hover:border-[#6366f1]/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
          <Receipt className="h-4.5 w-4.5 text-[#6366f1]" />
          <span>Recent Expenses & Breakdown</span>
        </h3>
        <a
          href="/expenses"
          className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] flex items-center gap-0.5 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Recent Expense List */}
        <div className="md:col-span-7 space-y-2.5">
          {EXPENSES.map((expense) => {
            const Icon = getCategoryIcon(expense.category)
            return (
              <div
                key={expense.id}
                className="group flex items-center justify-between p-3 bg-[#fafbfc] border border-[#f1f5f9] hover:border-[#6366f1]/20 hover:bg-[#6366f1]/[0.02] rounded-md transition-all duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg shadow-sm shrink-0',
                      getCategoryStyles(expense.category),
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-[#0f172a] truncate group-hover:text-[#6366f1] transition-colors">
                      {expense.title}
                    </span>
                    <span className="block text-[10px] text-[#94a3b8] font-medium uppercase tracking-wide">
                      {expense.timeAgo}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-bold text-[#0f172a] whitespace-nowrap">
                  -${expense.amount.toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Column: Category Breakdown */}
        <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-[#e2e8f0] pt-5 md:pt-0 md:pl-5 flex flex-col justify-center">
          <h4 className="text-xs font-bold text-[#64748b] tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
            <PieChart className="h-3.5 w-3.5 text-[#6366f1]" />
            Category Share
          </h4>
          <div className="space-y-3.5">
            {BREAKDOWN.map((item, i) => {
              const CatIcon = item.icon
              const totalBreakdown = BREAKDOWN.reduce((acc, curr) => acc + curr.amount, 0)
              const percentage = ((item.amount / totalBreakdown) * 100).toFixed(0)

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5 text-[#0f172a] capitalize">
                      <CatIcon className={cn('h-3.5 w-3.5', item.textColor)} />
                      <span>{item.category}</span>
                    </div>
                    <span className="text-[#64748b]">
                      ${item.amount.toFixed(2)} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', item.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
