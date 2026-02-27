import { Outlet } from 'react-router-dom'
import Layout from './Layout'

export default function PrivateRoute() {
  return <Layout><Outlet /></Layout>
}
