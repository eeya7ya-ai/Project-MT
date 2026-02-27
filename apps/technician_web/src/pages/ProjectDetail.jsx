import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../core/api'
import StatusBadge from '../components/StatusBadge'
import { MODULE_TYPES, MODULE_ICONS } from '../core/constants'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load from API, fallback to cached
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
      <button className="back-btn" onClick={() => navigate('/projects')}>← Back</button>
      <div className="alert alert-error">Project not found or no connection.</div>
    </div>
  )

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/projects')}>← Projects</button>

      <div className="card">
        <div style={{ marginBottom: 8 }}>
          <div className="font-bold" style={{ fontSize: 18, marginBottom: 4 }}>{project.name}</div>
          <StatusBadge status={project.status} />
        </div>
        <div className="text-sm text-gray" style={{ marginTop: 8 }}>
          {project.client_name && <div>📌 {project.client_name}</div>}
          {project.location && <div>📍 {project.location}</div>}
          {project.start_date && <div>📅 {new Date(project.start_date).toLocaleDateString()}</div>}
        </div>
      </div>

      <div className="section-title">Modules</div>

      {Object.entries(MODULE_TYPES).map(([type, label]) => {
        const mod = modules.find(m => m.type === type || m.module_type === type)
        return (
          <Link key={type} to={`/projects/${id}/modules/${type}`} className="module-card">
            <span className="module-icon">{MODULE_ICONS[type]}</span>
            <div className="module-info">
              <div className="module-name">{label}</div>
              <div className="module-sub">
                {mod ? `${mod.completed_count ?? 0}/${mod.items_count ?? 0} completed` : 'Tap to view'}
              </div>
            </div>
            <span className="module-arrow">›</span>
          </Link>
        )
      })}
    </div>
  )
}
