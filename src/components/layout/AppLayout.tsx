import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/auth.context'
import { navigationItems } from './navigation'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { signOut, user } = useAuth()

  async function handleSignOut() {
    setIsSigningOut(true)
    setLogoutError(null)
    const error = await signOut()
    setIsSigningOut(false)
    setLogoutError(error)
  }

  const navigation = (
    <nav aria-label="Main navigation" className="space-y-1">
      {navigationItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
            ].join(' ')
          }
          key={item.to}
          onClick={() => setIsMobileNavOpen(false)}
          to={item.to}
        >
          <span aria-hidden="true" className="w-5 text-center text-base">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <Brand />
        <div className="mt-8">{navigation}</div>
        <AccountActions
          email={user?.email}
          error={logoutError}
          isSigningOut={isSigningOut}
          onSignOut={handleSignOut}
        />
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Brand compact />
          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMobileNavOpen}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
            onClick={() => setIsMobileNavOpen((open) => !open)}
            type="button"
          >
            <span className="sr-only">Toggle navigation</span>
            <span aria-hidden="true" className="text-xl">
              {isMobileNavOpen ? '×' : '☰'}
            </span>
          </button>
        </div>
        {isMobileNavOpen ? (
          <div className="pt-3" id="mobile-navigation">
            {navigation}
            <AccountActions
              email={user?.email}
              error={logoutError}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
            />
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:ml-64 lg:px-10">
        {children}
      </main>
    </div>
  )
}

type AccountActionsProps = {
  email?: string
  error: string | null
  isSigningOut: boolean
  onSignOut: () => Promise<void>
}

function AccountActions({
  email,
  error,
  isSigningOut,
  onSignOut,
}: AccountActionsProps) {
  return (
    <div className="mt-8 border-t border-slate-200 pt-4">
      {email ? (
        <p className="truncate text-xs text-slate-500">{email}</p>
      ) : null}
      <button
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSigningOut}
        onClick={() => void onSignOut()}
        type="button"
      >
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  )
}

type BrandProps = {
  compact?: boolean
}

function Brand({ compact = false }: BrandProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
        S
      </div>
      <div className={compact ? '' : 'space-y-0.5'}>
        <p className="font-semibold tracking-tight">Study Tracker</p>
        {!compact ? (
          <p className="text-xs text-slate-500">Learn with intention</p>
        ) : null}
      </div>
    </div>
  )
}
