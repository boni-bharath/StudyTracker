import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { AuthLoadingState } from './AuthProvider'
import { useAuth } from './auth.context'

type AuthMode = 'sign-in' | 'sign-up'

export function LoginPage() {
  const { isLoading, user } = useAuth()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) {
    return <AuthLoadingState />
  }

  if (user) {
    return <Navigate replace to="/" />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!supabase) {
      setError(
        'Supabase is not configured. Add the public project URL and publishable key to .env.',
      )
      return
    }

    setIsSubmitting(true)

    const result =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Check your email to confirm your account, then sign in.')
      setMode('sign-in')
      return
    }

    if (mode === 'sign-up') {
      setMessage('Your account is ready. You are now signed in.')
    }
  }

  const isSignIn = mode === 'sign-in'

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4 text-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Study Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {isSignIn ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isSignIn
            ? 'Sign in to manage your private study data.'
            : 'Create a private account for your study data.'}
        </p>

        {!isSupabaseConfigured ? (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Add the public Supabase URL and publishable key to a local{' '}
            <code>.env</code> file before signing in.
          </p>
        ) : null}

        {error ? (
          <p
            className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {message ? (
          <p
            className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            role="status"
          >
            {message}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting || !isSupabaseConfigured}
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              disabled={isSubmitting || !isSupabaseConfigured}
              id="password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          <button
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            disabled={isSubmitting || !isSupabaseConfigured}
            type="submit"
          >
            {isSubmitting
              ? 'Please wait…'
              : isSignIn
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <button
          className="mt-5 text-sm font-medium text-indigo-700 hover:text-indigo-800"
          disabled={isSubmitting}
          onClick={() => {
            setMode(isSignIn ? 'sign-up' : 'sign-in')
            setError(null)
            setMessage(null)
          }}
          type="button"
        >
          {isSignIn
            ? 'Need an account? Sign up'
            : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  )
}
