import { supabase } from '../../lib/supabase'
import type { StudySession, StudyTimerData } from './studySession.types'

type StudySessionErrorKind = 'authentication' | 'configuration' | 'database'

export class StudySessionError extends Error {
  constructor(
    message: string,
    readonly kind: StudySessionErrorKind,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'StudySessionError'
  }
}

function getClient() {
  if (!supabase) {
    throw new StudySessionError(
      'Supabase is not configured. Add the public project URL and publishable key to your local .env file.',
      'configuration',
    )
  }

  return supabase
}

function databaseError(error: { message: string; code?: string }) {
  if (
    error.code === 'PGRST301' ||
    error.message.toLowerCase().includes('jwt') ||
    error.message.toLowerCase().includes('not authenticated')
  ) {
    return new StudySessionError(
      'Your session has expired. Please sign in again.',
      'authentication',
      error.code,
    )
  }

  return new StudySessionError(error.message, 'database', error.code)
}

export async function getActiveSession(
  userId: string,
): Promise<StudySession | null> {
  const { data, error } = await getClient()
    .from('study_sessions')
    .select('id, user_id, subject_id, start_time, end_time')
    .eq('user_id', userId)
    .is('end_time', null)
    .maybeSingle()

  if (error) {
    throw databaseError(error)
  }

  return data
}

export async function loadStudyTimerData(
  userId: string,
): Promise<StudyTimerData> {
  const client = getClient()
  const [subjectsResult, activeSessionResult] = await Promise.all([
    client
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', userId)
      .order('name', { ascending: true }),
    getActiveSession(userId),
  ])

  if (subjectsResult.error) {
    throw databaseError(subjectsResult.error)
  }

  return {
    activeSession: activeSessionResult,
    subjects: subjectsResult.data,
  }
}

export async function startStudySession(
  userId: string,
  subjectId: string,
): Promise<StudySession> {
  const { data, error } = await getClient()
    .from('study_sessions')
    .insert({
      end_time: null,
      start_time: new Date().toISOString(),
      subject_id: subjectId,
      user_id: userId,
    })
    .select('id, user_id, subject_id, start_time, end_time')
    .single()

  if (error) {
    throw databaseError(error)
  }

  return data
}

export async function stopStudySession(
  userId: string,
  sessionId: string,
): Promise<StudySession> {
  const { data, error } = await getClient()
    .from('study_sessions')
    .update({ end_time: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .is('end_time', null)
    .select('id, user_id, subject_id, start_time, end_time')
    .maybeSingle()

  if (error) {
    throw databaseError(error)
  }

  if (!data) {
    throw new StudySessionError(
      'This study session is no longer active. Reload the page to see its latest state.',
      'database',
    )
  }

  return data
}
