import { createClient } from '@/lib/supabase/server'
import { listExpenses, getSpendingSummary } from '@/modules/expenses/service'
import type { SpendingSummary } from '@/modules/expenses/types'
import ExpensesView from '@/modules/expenses/components/expenses-view'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const emptySummary: SpendingSummary = {
    todayTotal: 0,
    weekTotal: 0,
    currency: 'USD',
    byCategory: [],
  }

  if (!user) {
    return <ExpensesView expenses={[]} summary={emptySummary} />
  }

  const [expenses, summary] = await Promise.all([
    listExpenses(supabase, user.id, { scope: 'all', limit: 100 }),
    getSpendingSummary(supabase, user.id),
  ])

  return <ExpensesView expenses={expenses} summary={summary} />
}
