import { lazy, Suspense }        from 'react'
import { createBrowserRouter }   from 'react-router-dom'
import LoadingScreen             from '@/components/ui/LoadingScreen'
import {
  GuestRoute, ProtectedRoute,
  AdminRoute, StaffRoute
} from './guards'

const LoginPage   = lazy(() => import('@/features/auth/LoginPage'))
const AppShell    = lazy(() => import('@/components/layout/AppShell'))
const MatchesPage = lazy(() => import('@/features/matches/MatchesPage'))
const BetsPage    = lazy(() => import('@/features/bets/BetsPage'))
const RankingPage = lazy(() => import('@/features/ranking/RankingPage'))
const PrizesPage  = lazy(() => import('@/features/prizes/PrizesPage'))
const ProfilePage = lazy(() => import('@/features/auth/ProfilePage'))
const AdminPage   = lazy(() => import('@/features/admin/AdminPage'))
const StaffPage   = lazy(() => import('@/features/staff/StaffPage'))
const TermsPage   = lazy(() => import('@/features/auth/TermsPage'))

const wrap = (Component) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <GuestRoute>{wrap(LoginPage)}</GuestRoute>
  },
  {
    path: '/',
    element: <ProtectedRoute>{wrap(AppShell)}</ProtectedRoute>,
    children: [
      { index: true,       element: wrap(MatchesPage) },
      { path: 'apuestas',  element: wrap(BetsPage)    },
      { path: 'ranking',   element: wrap(RankingPage) },
      { path: 'premios',   element: wrap(PrizesPage)  },
      { path: 'perfil',    element: wrap(ProfilePage) },
    ]
  },
  {
    path: '/admin',
    element: <AdminRoute>{wrap(AdminPage)}</AdminRoute>
  },
  {
    path: '/staff',
    element: <StaffRoute>{wrap(StaffPage)}</StaffRoute>
  },
  {
  path: '/terminos',
  element: wrap(TermsPage)
},
])