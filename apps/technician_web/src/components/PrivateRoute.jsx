import { Navigate, Outlet } from 'react-router-dom'
import OfflineBanner from './OfflineBanner'
import BottomNav from './BottomNav'

export default function PrivateRoute() {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <OfflineBanner />
      <Outlet />
      <BottomNav />
    </div>
  )
}
