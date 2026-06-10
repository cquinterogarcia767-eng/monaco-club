import { Suspense, useEffect }  from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore }          from '@/store/authStore'
import LoadingScreen             from '@/components/ui/LoadingScreen'
import AdminShell                from '@/components/layout/AdminShell'

export function GuestRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (user)    return <Navigate to="/" replace />
  return children
}

export function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuthStore()

  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />

  // Mientras carga el perfil, mostrar loading
  if (!profile) return <LoadingScreen />

  if (profile.role === 'admin')  return <Navigate to="/admin" replace />
  if (profile.role === 'waiter') return <Navigate to="/staff" replace />

  return children
}

export function AdminRoute({ children }) {
  const { user, profile, loading } = useAuthStore()
  if (loading || !profile) return <LoadingScreen />
  if (!user)                     return <Navigate to="/login" replace />
  if (profile.role !== 'admin')  return <Navigate to="/"     replace />
  return <AdminShell>{children}</AdminShell>
}

export function StaffRoute({ children }) {
  const { user, profile, loading } = useAuthStore()
  if (loading || !profile) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  if (profile.role !== 'admin' && profile.role !== 'waiter')
    return <Navigate to="/" replace />
  return <AdminShell>{children}</AdminShell>
}