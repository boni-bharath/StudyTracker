import { createContext, useContext } from 'react'
import type { ThemePreference, UserSettings } from './settings.types'

export type SettingsContextValue = {
  error: string | null
  isLoading: boolean
  isSaving: boolean
  reloadSettings: () => Promise<void>
  saveSettings: (settings: UserSettings) => Promise<boolean>
  settings: UserSettings
  setThemePreview: (themePreference: ThemePreference | null) => void
  successMessage: string | null
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useUserSettings() {
  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error('useUserSettings must be used inside SettingsProvider.')
  }

  return context
}
