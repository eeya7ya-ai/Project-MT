import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../core/api'
import StatusBadge from '../../components/StatusBadge'

export default function ClientProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/technician/my-projects')
      .then(r => {
        setProjects(r.data)
        localStorage.setItem('cached_projects', JSON.stringify(r.data))
      })
      .catch(() => {
        const cached = localStorage.getItem('cached_projects')
        if (cached) setProjects(JSON.parse(cached))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="cl-page-header">
        <h1 className="page-title">My Projects</h1>
        <span className="cl-count">{projects.length} assigned</span>
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div className="empty-text">No projects assigned yet</div>
          <div className="empty-sub">Check back later or contact your dispatcher</div>
        </div>
      ) : (
        projects.map(p => (
          <Link key={p.id} to={`/projects/${p.id}`} className="cl-project-card">
            <div className="cl-project-card-top">
              <div className="cl-project-name">{p.name}</div>
              <StatusBadge status={p.status} />
            </div>
            <div className="cl-project-meta">
              {p.client_name && <span>🏢 {p.client_name}</span>}
              {p.location && <span>📍 {p.location}</span>}
              {p.start_date && (
                <span>📅 {new Date(p.start_date).toLocaleDateString()}</span>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
