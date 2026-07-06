/**
 * Formats an ISO timestamp as a human-readable string in a specific timezone,
 * e.g. "Wed, Jul 8, 10:00 AM". Used to hand the AI ready-made local times so it
 * never has to convert from UTC itself.
 */
export function formatInTimeZone(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
