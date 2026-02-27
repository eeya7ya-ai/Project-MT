import { Navigate, Outlet } from 'react-router-dom'
import Layout from './Layout'

export default function PrivateRoute() {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return <Layout><Outlet /></Layout>
}
