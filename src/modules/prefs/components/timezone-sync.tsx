'use client'

import { useEffect, useRef } from 'react'
import { updatePrefsAction } from '../actions'

/**
 * Auto-detects the browser's timezone and saves it to the user's prefs the
 * first time (while their stored timezone is still the default 'UTC'). This
 * personalizes date/time handling for the AI assistant without the user having
 * to open Settings. A manually chosen timezone is never overwritten.
 */
export default function TimezoneSync({
  serverTimezone,
  userSet = false,
}: {
  serverTimezone: string
  userSet?: boolean
}) {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    // Respect an explicit choice from Settings (even if it's UTC).
    if (userSet) return
    if (serverTimezone && serverTimezone !== 'UTC') return

    let browserTz = ''
    try {
      browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return
    }

    if (browserTz && browserTz !== serverTimezone) {
      updatePrefsAction({ timezone: browserTz }).catch(() => {})
    }
  }, [serverTimezone, userSet])

  return null
}
