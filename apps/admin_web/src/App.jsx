import { Routes, Route, Navigate } from 'react-router-dom'

// ── Admin pages ──────────────────────────────────────────
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import CreateProject from './pages/CreateProject'
import ModuleDetail from './pages/ModuleDetail'
import ExcelImport from './pages/ExcelImport'
import Users from './pages/Users'

// ── Client (technician) pages ────────────────────────────
import ClientProjects from './pages/client/Projects'
import ClientProjectDetail from './pages/client/ProjectDetail'
import ClientModuleChecklist from './pages/client/ModuleChecklist'
import ClientSchedule from './pages/client/Schedule'
import ClientProfile from './pages/client/Profile'

// ── Route guards ─────────────────────────────────────────
import AdminPrivateRoute from './components/PrivateRoute'
import ClientShell from './components/ClientShell'

export default function App() {
  return (
    <Routes>

      {/* ══ CLIENT / TECHNICIAN ROUTES  →  / ══ */}
      <Route element={<ClientShell />}>
        <Route path="/projects" element={<ClientProjects />} />
        <Route path="/projects/:id" element={<ClientProjectDetail />} />
        <Route path="/projects/:id/modules/:type" element={<ClientModuleChecklist />} />
        <Route path="/schedule" element={<ClientSchedule />} />
        <Route path="/profile" element={<ClientProfile />} />
      </Route>

      {/* ══ ADMIN ROUTES  →  /admin/* ══ */}
      <Route path="/admin" element={<Navigate to="/admin/projects" replace />} />
      <Route element={<AdminPrivateRoute />}>
        <Route path="/admin/projects" element={<Projects />} />
        <Route path="/admin/projects/create" element={<CreateProject />} />
        <Route path="/admin/projects/:id" element={<ProjectDetail />} />
        <Route path="/admin/projects/:id/edit" element={<CreateProject />} />
        <Route path="/admin/projects/:id/modules/:type" element={<ModuleDetail />} />
        <Route path="/admin/projects/:id/modules/:type/import" element={<ExcelImport />} />
        <Route path="/admin/users" element={<Users />} />
      </Route>

      {/* ══ FALLBACK ══ */}
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />

    </Routes>
  )
}
