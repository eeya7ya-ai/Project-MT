import { Navigate, Outlet } from 'react-router-dom'
import Layout from './Layout'

export default function PrivateRoute() {
  const token = localStorage.getItem('access_token')
  const role = localStorage.getItem('user_role')
  const isAdmin = role === 'admin' || role === 'dispatcher'
  if (!token || !isAdmin) return <Navigate to="/admin/login" replace />
  return <Layout><Outlet /></Layout>
}
