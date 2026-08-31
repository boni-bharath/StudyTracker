import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/auth.context'
import {
  HistoryServiceError,
  listCompletedStudySessions,
} from './history.service'
import type { HistorySession } from './history.types'

type StudyHistoryState = {
  error: string | null
  isLoading: boolean
  sessions: HistorySession[]
}

function historyErrorMessage(error: unknown) {
  if (error instanceof HistoryServiceError) {
    if (error.kind === 'authentication') {
      return 'Your session has expired. Please sign in again.'
    }

    if (error.kind === 'configuration') {
      return 'Supabase is not configured. Add the public project URL and publishable key to your local .env file.'
    }
  }

  return 'We could not load your study history. Please try again.'
}

export function useStudyHistory() {
  const { user } = useAuth()
  const [state, setState] = useState<StudyHistoryState>({
    error: null,
    isLoading: true,
    sessions: [],
  })

  const loadHistory = useCallback(async () => {
    if (!user) {
      setState({
        error: 'Your session has expired. Please sign in again.',
        isLoading: false,
        sessions: [],
      })
      return
    }

    setState((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const sessions = await listCompletedStudySessions(user.id)
      setState({ error: null, isLoading: false, sessions })
    } catch (error) {
      setState((current) => ({
        ...current,
        error: historyErrorMessage(error),
        isLoading: false,
      }))
    }
  }, [user])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  return { ...state, loadHistory }
}
