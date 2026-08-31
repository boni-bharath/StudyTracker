import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/auth.context'
import {
  getStreakMinimumMinutes,
  StreakServiceError,
} from '../streaks/streak.service'
import { deriveStudyStreak } from '../streaks/streak.utils'
import {
  listCompletedSessionsForStatistics,
  StatisticsServiceError,
} from './statistics.service'
import { deriveStudyStatistics } from './statistics.utils'
import type { CompletedStudySession, StatisticsRange } from './statistics.types'

function errorMessage(error: unknown) {
  if (error instanceof StreakServiceError) {
    if (error.kind === 'authentication') {
      return 'Your session has expired. Please sign in again.'
    }

    if (error.kind === 'configuration') {
      return 'Supabase is not configured. Add the public project URL and publishable key to your local .env file.'
    }
  }

  if (error instanceof StatisticsServiceError) {
    if (error.kind === 'authentication') {
      return 'Your session has expired. Please sign in again.'
    }

    if (error.kind === 'configuration') {
      return 'Supabase is not configured. Add the public project URL and publishable key to your local .env file.'
    }
  }

  return 'We could not load your study statistics. Please try again.'
}

export function useStudyStatistics() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<CompletedStudySession[]>([])
  const [streakMinimumMinutes, setStreakMinimumMinutes] = useState(30)
  const [selectedRange, setSelectedRange] = useState<StatisticsRange>('week')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadStatistics = useCallback(async () => {
    if (!user) {
      setError('Your session has expired. Please sign in again.')
      setIsLoading(false)
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const [loadedSessions, minimumMinutes] = await Promise.all([
        listCompletedSessionsForStatistics(user.id),
        getStreakMinimumMinutes(user.id),
      ])
      setSessions(loadedSessions)
      setStreakMinimumMinutes(minimumMinutes)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadStatistics()
  }, [loadStatistics])

  const statistics = useMemo(
    () => deriveStudyStatistics(sessions, selectedRange),
    [selectedRange, sessions],
  )
  const streak = useMemo(
    () => deriveStudyStreak(sessions, streakMinimumMinutes),
    [sessions, streakMinimumMinutes],
  )

  return {
    error,
    isLoading,
    loadStatistics,
    selectedRange,
    setSelectedRange,
    statistics,
    streak,
  }
}
