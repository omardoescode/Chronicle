import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import Cookies from 'js-cookie'

import DashboardLayout from '@/layouts/DashboardLayout'
import AuthPage from '@/pages/AuthPage'
import DashboardOverview from '@/pages/dashboard/Overview'
import ProjectsPage from '@/pages/dashboard/Projects'
import AnalyticsPage from '@/pages/dashboard/Analytics'
import SettingsPage from '@/pages/dashboard/Settings'

const ProtectedRoute = () => {
  const token = Cookies.get('auth_token')
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  )
}
