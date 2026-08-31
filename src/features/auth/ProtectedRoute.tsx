import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthLoadingState } from './AuthProvider'
import { useAuth } from './auth.context'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <AuthLoadingState />
  }

  if (!user) {
    return <Navigate replace to="/login" />
  }

  return children
}
