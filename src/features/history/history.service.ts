import { supabase } from '../../lib/supabase'
import type { HistorySession, HistorySubject } from './history.types'

type HistoryServiceErrorKind = 'authentication' | 'configuration' | 'database'

export class HistoryServiceError extends Error {
  constructor(
    message: string,
    readonly kind: HistoryServiceErrorKind,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'HistoryServiceError'
  }
}

function getClient() {
  if (!supabase) {
    throw new HistoryServiceError(
      'Supabase is not configured.',
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
    return new HistoryServiceError(
      'Your session has expired. Please sign in again.',
      'authentication',
      error.code,
    )
  }

  return new HistoryServiceError(error.message, 'database', error.code)
}

export async function listCompletedStudySessions(
  userId: string,
): Promise<HistorySession[]> {
  const { data, error } = await getClient()
    .from('study_sessions')
    .select(
      'id, subject_id, start_time, end_time, duration_seconds, subjects!study_sessions_subject_belongs_to_user(name, color)',
    )
    .eq('user_id', userId)
    .not('end_time', 'is', null)
    .order('end_time', { ascending: false })

  if (error) {
    throw databaseError(error)
  }

  return data.map((session) => {
    const subject = session.subjects as unknown as HistorySubject | null

    if (!subject) {
      throw new HistoryServiceError(
        'A session subject could not be loaded.',
        'database',
      )
    }

    return {
      durationSeconds: session.duration_seconds,
      endTime: session.end_time,
      id: session.id,
      startTime: session.start_time,
      subject: subject as HistorySubject,
      subjectId: session.subject_id,
    }
  })
}
