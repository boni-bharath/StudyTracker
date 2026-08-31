import { supabase } from '../../lib/supabase'
import type {
  ThemePreference,
  UserSettings,
  UserSettingsInput,
} from './settings.types'

export const DEFAULT_USER_SETTINGS: UserSettings = {
  dailyGoalMinutes: 120,
  streakMinimumMinutes: 30,
  themePreference: 'system',
}

type SettingsServiceErrorKind =
  'authentication' | 'configuration' | 'database' | 'validation'

export class SettingsServiceError extends Error {
  constructor(
    message: string,
    readonly kind: SettingsServiceErrorKind,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'SettingsServiceError'
  }
}

function getClient() {
  if (!supabase) {
    throw new SettingsServiceError(
      'Supabase is not configured.',
      'configuration',
    )
  }

  return supabase
}

function mapDatabaseError(error: { message: string; code?: string }) {
  if (
    error.code === 'PGRST301' ||
    error.message.toLowerCase().includes('jwt') ||
    error.message.toLowerCase().includes('not authenticated')
  ) {
    return new SettingsServiceError(
      'Your session has expired. Please sign in again.',
      'authentication',
      error.code,
    )
  }

  return new SettingsServiceError(error.message, 'database', error.code)
}

function validatePositiveWholeMinutes(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new SettingsServiceError(
      `${fieldName} must be a positive whole number of minutes.`,
      'validation',
    )
  }
}

function validateThemePreference(themePreference: string): ThemePreference {
  if (
    themePreference === 'light' ||
    themePreference === 'dark' ||
    themePreference === 'system'
  ) {
    return themePreference
  }

  throw new SettingsServiceError(
    'Choose a valid theme preference.',
    'validation',
  )
}

function normalizeSettings(data: {
  daily_goal_minutes: number
  streak_minimum_minutes: number
  theme: string
}): UserSettings {
  return {
    dailyGoalMinutes: data.daily_goal_minutes,
    streakMinimumMinutes: data.streak_minimum_minutes,
    themePreference: validateThemePreference(data.theme),
  }
}

export function normalizeThemePreference(
  themePreference: string,
): ThemePreference {
  return validateThemePreference(themePreference)
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await getClient()
    .from('user_settings')
    .select('daily_goal_minutes, streak_minimum_minutes, theme')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw mapDatabaseError(error)
  }

  if (!data) {
    return DEFAULT_USER_SETTINGS
  }

  return normalizeSettings(data)
}

export async function saveUserSettings(
  userId: string,
  input: UserSettingsInput,
): Promise<UserSettings> {
  validatePositiveWholeMinutes(input.dailyGoalMinutes, 'Daily goal')
  validatePositiveWholeMinutes(input.streakMinimumMinutes, 'Streak minimum')

  const payload = {
    daily_goal_minutes: input.dailyGoalMinutes,
    streak_minimum_minutes: input.streakMinimumMinutes,
    theme: validateThemePreference(input.themePreference),
    user_id: userId,
  }

  const { data, error } = await getClient()
    .from('user_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select('daily_goal_minutes, streak_minimum_minutes, theme')
    .single()

  if (error) {
    throw mapDatabaseError(error)
  }

  return normalizeSettings(data)
}
