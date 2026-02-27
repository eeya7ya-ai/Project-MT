import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import CreateProject from './pages/CreateProject'
import ModuleDetail from './pages/ModuleDetail'
import ExcelImport from './pages/ExcelImport'
import Users from './pages/Users'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/create" element={<CreateProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/edit" element={<CreateProject />} />
        <Route path="/projects/:id/modules/:type" element={<ModuleDetail />} />
        <Route path="/projects/:id/modules/:type/import" element={<ExcelImport />} />
        <Route path="/users" element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}
