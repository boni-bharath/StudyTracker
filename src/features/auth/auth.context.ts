import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type AuthContextValue = {
  isLoading: boolean
  signOut: () => Promise<string | null>
  user: User | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
