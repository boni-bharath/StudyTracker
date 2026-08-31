import type { CompletedStudySession } from '../statistics/statistics.types'
import {
  localDateKey,
  splitStudySessionByLocalDay,
  startOfLocalDay,
} from '../statistics/statistics.utils'
import type { StudyStreak } from './streak.types'

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function previousDayKey(key: string) {
  const date = dateFromKey(key)
  date.setDate(date.getDate() - 1)
  return localDateKey(date)
}

export function deriveStudyStreak(
  sessions: CompletedStudySession[],
  minimumMinutes: number,
  currentTime = new Date(),
): StudyStreak {
  const now = new Date(currentTime)
  const qualifyingSeconds = minimumMinutes * 60
  const dailyTotals = new Map<string, number>()

  for (const session of sessions) {
    if (new Date(session.endTime) > now) continue

    for (const portion of splitStudySessionByLocalDay(
      session,
      new Date(0),
      now,
    )) {
      const day = localDateKey(portion.date)
      dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + portion.seconds)
    }
  }

  const qualifyingDays = new Set(
    [...dailyTotals.entries()]
      .filter(([, totalSeconds]) => totalSeconds >= qualifyingSeconds)
      .map(([day]) => day),
  )
  const totalStudyDays = [...dailyTotals.values()].filter(
    (totalSeconds) => totalSeconds > 0,
  ).length
  const today = localDateKey(startOfLocalDay(now))
  let currentDay = qualifyingDays.has(today) ? today : previousDayKey(today)
  let currentStreak = 0

  while (qualifyingDays.has(currentDay)) {
    currentStreak += 1
    currentDay = previousDayKey(currentDay)
  }

  const sortedQualifyingDays = [...qualifyingDays].sort()
  let longestStreak = 0
  let runningStreak = 0
  let previousDay: string | null = null

  for (const day of sortedQualifyingDays) {
    runningStreak = previousDay === previousDayKey(day) ? runningStreak + 1 : 1
    longestStreak = Math.max(longestStreak, runningStreak)
    previousDay = day
  }

  return {
    currentStreak,
    longestStreak,
    minimumMinutes,
    totalStudyDays,
  }
}
