'use client'

import { useState, useTransition } from 'react'
import {
  Loader2,
  Save,
  LocateFixed,
  User,
  Settings as SettingsIcon,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Prefs } from '../types'
import { updatePrefsAction } from '../actions'
import { updateProfileAction, changePasswordAction } from '@/modules/profile/actions'

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

type Tab = 'profile' | 'preferences' | 'security'

const NAV_ITEMS: { key: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'profile',     label: 'Profile',      icon: User,          description: 'Name and account info' },
  { key: 'preferences', label: 'Preferences',  icon: SettingsIcon,  description: 'Currency and timezone' },
  { key: 'security',    label: 'Security',     icon: Lock,          description: 'Password and access' },
]

function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description: string
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#f1f5f9] pb-4 mb-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6366f1]/10">
        <Icon className="h-4 w-4 text-[#6366f1]" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
        <p className="text-xs text-[#64748b]">{description}</p>
      </div>
    </div>
  )
}

export default function SettingsView({
  prefs,
  email,
  fullName,
  avatarUrl,
}: {
  prefs: Prefs
  email: string | null
  fullName: string | null
  avatarUrl: string | null
}) {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Profile state
  const [name, setName] = useState(fullName ?? '')
  const [profilePending, startProfileTransition] = useTransition()

  // Prefs state
  const [currency, setCurrency] = useState(prefs.currency)
  const [timezone, setTimezone] = useState(prefs.timezone)
  const [prefsPending, startPrefsTransition] = useTransition()

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordPending, startPasswordTransition] = useTransition()
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const timezoneOptions = Array.from(new Set([...TIMEZONES, timezone]))

  const initials = (fullName || email?.split('@')[0] || 'U')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    startProfileTransition(async () => {
      const result = await updateProfileAction({ fullName: name })
      if (result.error) toast.error(result.error)
      else toast.success('Profile updated')
    })
  }

  const handlePrefsSave = (e: React.FormEvent) => {
    e.preventDefault()
    startPrefsTransition(async () => {
      try {
        await updatePrefsAction({ currency, timezone }, true)
        toast.success('Preferences saved')
      } catch {
        toast.error('Could not save preferences')
      }
    })
  }

  const handleUseBrowser = () => {
    let browserTz = ''
    try { browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone } catch { browserTz = '' }
    if (!browserTz) { toast.error('Could not detect your browser timezone'); return }
    setTimezone(browserTz)
    startPrefsTransition(async () => {
      try {
        await updatePrefsAction({ currency, timezone: browserTz }, false)
        toast.success(`Using your browser timezone (${browserTz})`)
      } catch {
        toast.error('Could not update timezone')
      }
    })
  }

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(false)
    startPasswordTransition(async () => {
      const result = await changePasswordAction({ newPassword, confirmPassword })
      if (result.error) {
        toast.error(result.error)
      } else {
        setNewPassword('')
        setConfirmPassword('')
        setPasswordSuccess(true)
        toast.success('Password updated')
      }
    })
  }

  const passwordStrength = (() => {
    if (!newPassword) return null
    if (newPassword.length < 8) return { label: 'Too short', color: '#dc2626', width: '25%' }
    if (newPassword.length < 12) return { label: 'Fair', color: '#d97706', width: '50%' }
    if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) return { label: 'Strong', color: '#16a34a', width: '100%' }
    return { label: 'Good', color: '#0891b2', width: '75%' }
  })()

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-[rgba(241,245,249,0.92)] px-4 py-4 backdrop-blur-md md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Settings</h1>
        <p className="text-xs text-[#64748b] md:text-sm">Manage your profile, preferences, and security</p>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 p-4 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:gap-8">

          {/* Left nav */}
          <aside className="w-full md:w-52 shrink-0">
            <nav className="rounded-xl border border-[#e9eef5] bg-white shadow-sm overflow-hidden">
              {NAV_ITEMS.map((item, i) => {
                const Icon = item.icon
                const isActive = activeTab === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                      i < NAV_ITEMS.length - 1 && 'border-b border-[#f1f5f9]',
                      isActive
                        ? 'bg-[#6366f1]/[0.06] text-[#6366f1]'
                        : 'text-[#64748b] hover:bg-[#fafbfc] hover:text-[#0f172a]',
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-[#6366f1]/10' : 'bg-[#f1f5f9]',
                    )}>
                      <Icon className={cn('h-4 w-4', isActive ? 'text-[#6366f1]' : 'text-[#475569]')} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-sm font-medium', isActive ? 'text-[#6366f1]' : 'text-[#0f172a]')}>
                        {item.label}
                      </p>
                      <p className="text-[11px] text-[#94a3b8] truncate">{item.description}</p>
                    </div>
                    {isActive && (
                      <div className="ml-auto h-4 w-0.5 rounded-full bg-[#6366f1]" />
                    )}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Right content panel */}
          <div className="flex-1 min-w-0">

            {/* Profile */}
            {activeTab === 'profile' && (
              <form
                onSubmit={handleProfileSave}
                className="space-y-5 rounded-xl border border-[#e9eef5] bg-white p-5 shadow-sm"
              >
                <SectionHeader icon={User} title="Profile" description="Your public display name and account email" />

                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="h-14 w-14 rounded-full object-cover border-2 border-[#e2e8f0]" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6366f1]/10 text-[#6366f1] text-lg font-bold border-2 border-[#6366f1]/20">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">{name || 'No name set'}</p>
                    <p className="text-xs text-[#94a3b8]">{email}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#334155]">Display name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#334155]">Email</label>
                  <input
                    value={email ?? ''}
                    disabled
                    className="w-full rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] px-3 py-2 text-sm text-[#94a3b8] cursor-not-allowed"
                  />
                  <p className="text-xs text-[#94a3b8]">Email cannot be changed here.</p>
                </div>

                <button
                  type="submit"
                  disabled={profilePending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                >
                  {profilePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save profile
                </button>
              </form>
            )}

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <form
                onSubmit={handlePrefsSave}
                className="space-y-5 rounded-xl border border-[#e9eef5] bg-white p-5 shadow-sm"
              >
                <SectionHeader icon={SettingsIcon} title="Preferences" description="Currency and timezone used across the app" />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#334155]">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <p className="text-xs text-[#94a3b8]">Used across expenses and the dashboard.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#334155]">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
                  >
                    {timezoneOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-[#94a3b8]">Affects how &ldquo;today&rdquo; and due dates are shown.</p>
                    <button
                      type="button"
                      onClick={handleUseBrowser}
                      disabled={prefsPending}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#6366f1] transition-colors hover:bg-[#6366f1]/10 disabled:opacity-50"
                    >
                      <LocateFixed className="h-3.5 w-3.5" />
                      Detect from browser
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={prefsPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                >
                  {prefsPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save preferences
                </button>
              </form>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <form
                onSubmit={handlePasswordSave}
                className="space-y-5 rounded-xl border border-[#e9eef5] bg-white p-5 shadow-sm"
              >
                <SectionHeader icon={Lock} title="Security" description="Change your account password" />

                {passwordSuccess && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-[#16a34a]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Password updated successfully.
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#334155]">New password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordSuccess(false) }}
                      placeholder="At least 8 characters"
                      className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 pr-10 text-sm outline-none focus:border-[#6366f1] focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordStrength && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                        />
                      </div>
                      <p className="text-[10px] font-medium" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#334155]">Confirm new password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordSuccess(false) }}
                      placeholder="Repeat your new password"
                      className={cn(
                        'w-full rounded-lg border bg-[#f8fafc] px-3 py-2 pr-10 text-sm outline-none focus:bg-white transition-colors',
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-[#dc2626] focus:border-[#dc2626]'
                          : 'border-[#e2e8f0] focus:border-[#6366f1]',
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-[#dc2626]">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={passwordPending || !newPassword || !confirmPassword}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e293b] disabled:opacity-50 transition-colors"
                >
                  {passwordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Update password
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
