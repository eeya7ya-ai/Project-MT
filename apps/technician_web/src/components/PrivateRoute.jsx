import { Outlet } from 'react-router-dom'
import OfflineBanner from './OfflineBanner'
import BottomNav from './BottomNav'

export default function PrivateRoute() {
  return (
    <div className="app-shell">
      <OfflineBanner />
      <Outlet />
      <BottomNav />
    </div>
  )
}
