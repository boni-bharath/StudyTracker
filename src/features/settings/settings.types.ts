export type ThemePreference = 'dark' | 'light' | 'system'

export type UserSettings = {
  dailyGoalMinutes: number
  streakMinimumMinutes: number
  themePreference: ThemePreference
}

export type UserSettingsInput = UserSettings
