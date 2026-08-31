import { AuthProvider } from '../features/auth/AuthProvider'
import { SettingsProvider } from '../features/settings/SettingsProvider'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppRoutes />
      </SettingsProvider>
    </AuthProvider>
  )
}
