import { Routes, Route, Navigate } from 'react-router-dom'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import ModuleChecklist from './pages/ModuleChecklist'
import Schedule from './pages/Schedule'
import Profile from './pages/Profile'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/modules/:type" element={<ModuleChecklist />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}
