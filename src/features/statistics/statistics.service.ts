import { supabase } from '../../lib/supabase'
import type {
  CompletedStudySession,
  StatisticsSubject,
} from './statistics.types'

type StatisticsServiceErrorKind =
  'authentication' | 'configuration' | 'database'

export class StatisticsServiceError extends Error {
  constructor(
    message: string,
    readonly kind: StatisticsServiceErrorKind,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'StatisticsServiceError'
  }
}

function getClient() {
  if (!supabase) {
    throw new StatisticsServiceError(
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
    return new StatisticsServiceError(
      'Your session has expired. Please sign in again.',
      'authentication',
      error.code,
    )
  }

  return new StatisticsServiceError(error.message, 'database', error.code)
}

export async function listCompletedSessionsForStatistics(
  userId: string,
): Promise<CompletedStudySession[]> {
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

  return data.flatMap((session) => {
    const subject = session.subjects as unknown as StatisticsSubject | null

    if (!subject || !session.end_time || session.duration_seconds === null) {
      return []
    }

    return [
      {
        durationSeconds: session.duration_seconds,
        endTime: session.end_time,
        id: session.id,
        startTime: session.start_time,
        subject,
        subjectId: session.subject_id,
      },
    ]
  })
}
