import { useEffect, useState, type FormEvent } from 'react'
import { useUserSettings } from './useUserSettings'
import type { ThemePreference } from './settings.types'

export function SettingsPage() {
  const {
    error,
    isLoading,
    isSaving,
    saveSettings,
    settings,
    setThemePreview,
    successMessage,
  } = useUserSettings()
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState('120')
  const [streakMinimumMinutes, setStreakMinimumMinutes] = useState('30')
  const [themePreference, setThemePreference] =
    useState<ThemePreference>('system')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setDailyGoalMinutes(String(settings.dailyGoalMinutes))
    setStreakMinimumMinutes(String(settings.streakMinimumMinutes))
    setThemePreference(settings.themePreference)
  }, [settings])

  useEffect(() => {
    setThemePreview(themePreference)

    return () => {
      setThemePreview(null)
    }
  }, [setThemePreview, themePreference])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsedDailyGoal = Number.parseInt(dailyGoalMinutes, 10)
    const parsedStreakMinimum = Number.parseInt(streakMinimumMinutes, 10)

    if (!Number.isInteger(parsedDailyGoal) || parsedDailyGoal < 1) {
      setFormError('Daily goal must be a positive whole number of minutes.')
      return
    }

    if (!Number.isInteger(parsedStreakMinimum) || parsedStreakMinimum < 1) {
      setFormError('Streak minimum must be a positive whole number of minutes.')
      return
    }

    await saveSettings({
      dailyGoalMinutes: parsedDailyGoal,
      streakMinimumMinutes: parsedStreakMinimum,
      themePreference,
    })
  }

  return (
    <section className="max-w-3xl">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Study Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Settings
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Control your daily goal, streak threshold, and appearance preference.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Loading your settings...
        </div>
      ) : (
        <form
          className="mt-8 space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Daily study goal</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                inputMode="numeric"
                min={1}
                onChange={(event) => setDailyGoalMinutes(event.target.value)}
                type="number"
                value={dailyGoalMinutes}
              />
              <span className="block text-xs font-normal text-slate-500">
                Positive whole minutes only.
              </span>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Streak minimum</span>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                inputMode="numeric"
                min={1}
                onChange={(event) =>
                  setStreakMinimumMinutes(event.target.value)
                }
                type="number"
                value={streakMinimumMinutes}
              />
              <span className="block text-xs font-normal text-slate-500">
                A day counts only when completed study reaches this number.
              </span>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Theme</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) =>
                setThemePreference(event.target.value as ThemePreference)
              }
              value={themePreference}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <span className="block text-xs font-normal text-slate-500">
              System follows your operating system&apos;s color scheme.
            </span>
          </label>

          {formError || error ? (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              role="alert"
            >
              {formError || error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Saving...' : 'Save settings'}
            </button>
            <p className="text-sm text-slate-500">
              Changes apply immediately after saving.
            </p>
          </div>
        </form>
      )}
    </section>
  )
}
