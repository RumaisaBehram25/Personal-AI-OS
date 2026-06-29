'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

/**
 * Global client-side providers: theme (light/dark) and toast notifications.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  )
}
