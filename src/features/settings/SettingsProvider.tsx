import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/auth.context'
import {
  DEFAULT_USER_SETTINGS,
  getUserSettings,
  saveUserSettings,
  SettingsServiceError,
} from './settings.service'
import { SettingsContext, type SettingsContextValue } from './settings.context'
import type { ThemePreference, UserSettings } from './settings.types'

type SettingsProviderProps = {
  children: ReactNode
}

function resolveThemePreference(
  themePreference: ThemePreference,
  systemTheme: 'dark' | 'light',
): 'dark' | 'light' {
  if (themePreference === 'dark') {
    return 'dark'
  }

  if (themePreference === 'light') {
    return 'light'
  }

  return systemTheme
}

function readSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function errorMessage(error: unknown) {
  if (error instanceof SettingsServiceError) {
    if (error.kind === 'authentication') {
      return 'Your session has expired. Please sign in again.'
    }

    if (error.kind === 'configuration') {
      return 'Supabase is not configured. Add the public project URL and publishable key to your local .env file.'
    }

    if (error.kind === 'validation') {
      return error.message
    }
  }

  return 'We could not load your settings. Please try again.'
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [themePreview, setThemePreview] = useState<ThemePreference | null>(null)
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(
    readSystemTheme,
  )

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_USER_SETTINGS)
      setThemePreview(null)
      setIsLoading(false)
      setError(null)
      setSuccessMessage(null)
      return
    }

    let isMounted = true

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    void getUserSettings(user.id)
      .then((loadedSettings) => {
        if (!isMounted) return
        setSettings(loadedSettings)
      })
      .catch((loadError) => {
        if (!isMounted) return
        setError(errorMessage(loadError))
        setSettings(DEFAULT_USER_SETTINGS)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    setSystemTheme(readSystemTheme())

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }

    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [])

  useEffect(() => {
    const resolvedTheme = resolveThemePreference(
      themePreview ?? settings.themePreference,
      systemTheme,
    )

    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [settings.themePreference, systemTheme, themePreview])

  const value = useMemo<SettingsContextValue>(
    () => ({
      error,
      isLoading,
      isSaving,
      reloadSettings: async () => {
        if (!user) {
          setSettings(DEFAULT_USER_SETTINGS)
          return
        }

        setIsLoading(true)
        setError(null)
        try {
          const loadedSettings = await getUserSettings(user.id)
          setSettings(loadedSettings)
        } catch (loadError) {
          setError(errorMessage(loadError))
        } finally {
          setIsLoading(false)
        }
      },
      saveSettings: async (nextSettings) => {
        if (!user) {
          setError('Your session has expired. Please sign in again.')
          return false
        }

        setIsSaving(true)
        setError(null)
        setSuccessMessage(null)

        try {
          const savedSettings = await saveUserSettings(user.id, nextSettings)
          setSettings(savedSettings)
          setThemePreview(null)
          setSuccessMessage('Settings saved.')
          return true
        } catch (saveError) {
          setError(errorMessage(saveError))
          return false
        } finally {
          setIsSaving(false)
        }
      },
      settings,
      setThemePreview,
      successMessage,
    }),
    [error, isLoading, isSaving, settings, successMessage, user],
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
