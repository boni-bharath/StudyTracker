import { supabase } from '../../lib/supabase'
import { DEFAULT_USER_SETTINGS } from '../settings/settings.service'

export const DEFAULT_STREAK_MINIMUM_MINUTES =
  DEFAULT_USER_SETTINGS.streakMinimumMinutes

type StreakServiceErrorKind = 'authentication' | 'configuration' | 'database'

export class StreakServiceError extends Error {
  constructor(
    message: string,
    readonly kind: StreakServiceErrorKind,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'StreakServiceError'
  }
}

function getClient() {
  if (!supabase) {
    throw new StreakServiceError('Supabase is not configured.', 'configuration')
  }

  return supabase
}

function databaseError(error: { message: string; code?: string }) {
  if (
    error.code === 'PGRST301' ||
    error.message.toLowerCase().includes('jwt') ||
    error.message.toLowerCase().includes('not authenticated')
  ) {
    return new StreakServiceError(
      'Your session has expired. Please sign in again.',
      'authentication',
      error.code,
    )
  }

  return new StreakServiceError(error.message, 'database', error.code)
}

export async function getStreakMinimumMinutes(userId: string) {
  const { data, error } = await getClient()
    .from('user_settings')
    .select('streak_minimum_minutes')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw databaseError(error)
  }

  return data?.streak_minimum_minutes ?? DEFAULT_STREAK_MINIMUM_MINUTES
}
