import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../core/api'
import StatusBadge from '../../components/StatusBadge'
import { MODULE_TYPES, MODULE_ICONS } from '../../core/constants'

export default function ClientProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/technician/sync/${id}`)
      .then(r => {
        const data = r.data
        setProject(data.project || data)
        setModules(data.modules || [])
        localStorage.setItem(`project_${id}`, JSON.stringify(data))
      })
      .catch(() => {
        const cached = localStorage.getItem(`project_${id}`)
        if (cached) {
          const data = JSON.parse(cached)
          setProject(data.project || data)
          setModules(data.modules || [])
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  if (!project) return (
    <div className="page">
      <button className="cl-back-btn" onClick={() => navigate('/projects')}>← Back</button>
      <div className="alert alert-error">Project not found or no connection.</div>
    </div>
  )

  return (
    <div className="page">
      <button className="cl-back-btn" onClick={() => navigate('/projects')}>← Projects</button>

      <div className="card">
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{project.name}</div>
          <StatusBadge status={project.status} />
        </div>
        <div className="cl-meta-list">
          {project.client_name && <div className="cl-meta-item"><span>🏢</span> {project.client_name}</div>}
          {project.location && <div className="cl-meta-item"><span>📍</span> {project.location}</div>}
          {project.start_date && (
            <div className="cl-meta-item">
              <span>📅</span> {new Date(project.start_date).toLocaleDateString()}
              {project.end_date && ` → ${new Date(project.end_date).toLocaleDateString()}`}
            </div>
          )}
          {project.description && (
            <div className="cl-meta-item" style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              {project.description}
            </div>
          )}
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 8 }}>Modules</div>

      {Object.entries(MODULE_TYPES).map(([type, label]) => {
        const mod = modules.find(m => m.type === type || m.module_type === type)
        const done = mod?.completed_count ?? 0
        const total = mod?.items_count ?? 0
        const pct = total ? Math.round((done / total) * 100) : 0

        return (
          <Link key={type} to={`/projects/${id}/modules/${type}`} className="cl-module-row">
            <span className="cl-module-icon">{MODULE_ICONS[type]}</span>
            <div className="cl-module-info">
              <div className="cl-module-name">{label}</div>
              {mod ? (
                <>
                  <div className="cl-module-sub">{done}/{total} completed</div>
                  <div className="cl-progress-bar">
                    <div className="cl-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </>
              ) : (
                <div className="cl-module-sub">Not started</div>
              )}
            </div>
            <span className="cl-module-arrow">›</span>
          </Link>
        )
      })}
    </div>
  )
}
