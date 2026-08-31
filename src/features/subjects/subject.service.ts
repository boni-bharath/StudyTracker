import { supabase } from '../../lib/supabase'
import type {
  Subject,
  SubjectInput,
  SubjectWithStudyTime,
} from './subject.types'

type ServiceErrorKind = 'authentication' | 'configuration' | 'database'

export class SubjectServiceError extends Error {
  constructor(
    message: string,
    readonly kind: ServiceErrorKind,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'SubjectServiceError'
  }
}

async function getCurrentUserId(): Promise<string> {
  if (!supabase) {
    throw new SubjectServiceError(
      'Supabase is not configured. Add the public URL and publishable key to your local .env file.',
      'configuration',
    )
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new SubjectServiceError(
      'A signed-in Supabase user is required to manage subjects.',
      'authentication',
    )
  }

  return user.id
}

function databaseError(error: { message: string; code?: string }) {
  return new SubjectServiceError(error.message, 'database', error.code)
}

export async function listSubjects(): Promise<SubjectWithStudyTime[]> {
  const userId = await getCurrentUserId()
  const [subjectsResult, sessionsResult] = await Promise.all([
    supabase!
      .from('subjects')
      .select('id, user_id, name, color, created_at, updated_at')
      .eq('user_id', userId)
      .order('name', { ascending: true }),
    supabase!
      .from('study_sessions')
      .select('subject_id, start_time, end_time')
      .eq('user_id', userId)
      .not('end_time', 'is', null),
  ])

  if (subjectsResult.error) {
    throw databaseError(subjectsResult.error)
  }

  if (sessionsResult.error) {
    throw databaseError(sessionsResult.error)
  }

  const totalsBySubjectId = new Map<string, number>()
  for (const session of sessionsResult.data) {
    if (!session.end_time) continue

    const durationSeconds = Math.max(
      0,
      (new Date(session.end_time).getTime() -
        new Date(session.start_time).getTime()) /
        1000,
    )
    totalsBySubjectId.set(
      session.subject_id,
      (totalsBySubjectId.get(session.subject_id) ?? 0) + durationSeconds,
    )
  }

  return subjectsResult.data.map((subject) => ({
    ...subject,
    totalStudySeconds: totalsBySubjectId.get(subject.id) ?? 0,
  }))
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase!
    .from('subjects')
    .insert({ name: input.name.trim(), color: input.color, user_id: userId })
    .select('id, user_id, name, color, created_at, updated_at')
    .single()

  if (error) {
    throw databaseError(error)
  }

  return data
}

export async function updateSubject(
  id: string,
  input: SubjectInput,
): Promise<Subject> {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase!
    .from('subjects')
    .update({ name: input.name.trim(), color: input.color })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, user_id, name, color, created_at, updated_at')
    .single()

  if (error) {
    throw databaseError(error)
  }

  return data
}

export async function deleteSubject(id: string): Promise<void> {
  const userId = await getCurrentUserId()
  const { error } = await supabase!
    .from('subjects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw databaseError(error)
  }
}
