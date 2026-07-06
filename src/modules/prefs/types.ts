export interface Prefs {
  timezone: string
  currency: string
  preferences: Record<string, unknown>
}

export interface UpdatePrefsInput {
  timezone?: string
  currency?: string
  preferences?: Record<string, unknown>
}
