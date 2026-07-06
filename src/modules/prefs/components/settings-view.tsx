'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Prefs } from '../types'
import { updatePrefsAction } from '../actions'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'CAD', 'AUD']
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
]

export default function SettingsView({
  prefs,
  email,
}: {
  prefs: Prefs
  email: string | null
}) {
  const [currency, setCurrency] = useState(prefs.currency)
  const [timezone, setTimezone] = useState(prefs.timezone)
  const [isPending, startTransition] = useTransition()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updatePrefsAction({ currency, timezone }, true)
        toast.success('Preferences saved')
      } catch {
        toast.error('Could not save preferences')
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[#f1f5f9]/92 px-4 py-4 backdrop-blur-md md:px-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#0f172a]">
          <SettingsIcon className="h-5 w-5 text-[#6366f1]" />
          Settings
        </h1>
        <p className="text-xs text-[#64748b] md:text-sm">
          Personalize how HypoOS works for you
        </p>
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 space-y-6 p-4 md:p-8">
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-xl border border-[#e9eef5] bg-white p-5 shadow-sm"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#334155]">Email</label>
            <input
              value={email ?? ''}
              disabled
              className="w-full rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] px-3 py-2 text-sm text-[#94a3b8]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#334155]">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#94a3b8]">
              Used across expenses and the dashboard.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#334155]">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white"
            >
              {TIMEZONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#94a3b8]">
              Affects how &ldquo;today&rdquo; and due dates are shown.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </button>
        </form>
      </div>
    </div>
  )
}
