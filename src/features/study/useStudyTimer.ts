import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/auth.context'
import {
  getActiveSession,
  loadStudyTimerData,
  startStudySession,
  stopStudySession,
  StudySessionError,
} from './studySession.service'
import type { StudySession, StudySubject } from './studySession.types'

type StudyTimerState = {
  activeSession: StudySession | null
  completedSession: StudySession | null
  error: string | null
  isLoading: boolean
  isSaving: boolean
  subjects: StudySubject[]
}

function errorMessage(error: unknown, action: string) {
  if (error instanceof StudySessionError) {
    if (error.kind === 'authentication') {
      return 'Your session has expired. Please sign in again.'
    }

    if (error.kind === 'configuration') {
      return error.message
    }

    if (error.code === '23503') {
      return 'That subject is no longer available. Reload the page and choose another subject.'
    }

    return 'We could not ' + action + '. Please try again.'
  }

  return 'We could not ' + action + '. Please try again.'
}

function elapsedSeconds(startTime: string, currentTime: number) {
  return Math.max(
    0,
    Math.floor((currentTime - new Date(startTime).getTime()) / 1000),
  )
}

export function useStudyTimer() {
  const { user } = useAuth()
  const [state, setState] = useState<StudyTimerState>({
    activeSession: null,
    completedSession: null,
    error: null,
    isLoading: true,
    isSaving: false,
    subjects: [],
  })
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const loadTimer = useCallback(async () => {
    if (!user) {
      setState((current) => ({
        ...current,
        error: 'Your session has expired. Please sign in again.',
        isLoading: false,
      }))
      return
    }

    setState((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const data = await loadStudyTimerData(user.id)
      setState((current) => ({
        ...current,
        activeSession: data.activeSession,
        error: null,
        isLoading: false,
        subjects: data.subjects,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        error: errorMessage(error, 'load your study timer'),
        isLoading: false,
      }))
    }
  }, [user])

  useEffect(() => {
    void loadTimer()
  }, [loadTimer])

  useEffect(() => {
    if (!state.activeSession) {
      return
    }

    setCurrentTime(Date.now())
    const intervalId = window.setInterval(
      () => setCurrentTime(Date.now()),
      1000,
    )

    return () => window.clearInterval(intervalId)
  }, [state.activeSession])

  const activeElapsedSeconds = useMemo(
    () =>
      state.activeSession
        ? elapsedSeconds(state.activeSession.start_time, currentTime)
        : 0,
    [currentTime, state.activeSession],
  )

  const start = async (subjectId: string) => {
    if (!user) {
      setState((current) => ({
        ...current,
        error: 'Your session has expired. Please sign in again.',
      }))
      return false
    }

    setState((current) => ({
      ...current,
      completedSession: null,
      error: null,
      isSaving: true,
    }))

    try {
      const session = await startStudySession(user.id, subjectId)
      setCurrentTime(Date.now())
      setState((current) => ({
        ...current,
        activeSession: session,
        isSaving: false,
      }))
      return true
    } catch (error) {
      if (error instanceof StudySessionError && error.code === '23505') {
        try {
          const activeSession = await getActiveSession(user.id)
          if (activeSession) {
            setCurrentTime(Date.now())
            setState((current) => ({
              ...current,
              activeSession,
              error:
                'An active study session was already running, so it was restored.',
              isSaving: false,
            }))
            return false
          }
        } catch {
          // Keep the original creation error if the recovery lookup fails.
        }
      }

      setState((current) => ({
        ...current,
        error: errorMessage(error, 'start your study session'),
        isSaving: false,
      }))
      return false
    }
  }

  const stop = async () => {
    if (!user || !state.activeSession) {
      return false
    }

    setState((current) => ({ ...current, error: null, isSaving: true }))

    try {
      const session = await stopStudySession(user.id, state.activeSession.id)
      setState((current) => ({
        ...current,
        activeSession: null,
        completedSession: session,
        isSaving: false,
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        error: errorMessage(error, 'stop your study session'),
        isSaving: false,
      }))
      return false
    }
  }

  return {
    ...state,
    activeElapsedSeconds,
    loadTimer,
    start,
    stop,
  }
}
