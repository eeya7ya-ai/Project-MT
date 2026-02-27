import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../core/api'
import StatusBadge from '../components/StatusBadge'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/technician/my-projects')
      .then(r => {
        setProjects(r.data)
        localStorage.setItem('cached_projects', JSON.stringify(r.data))
      })
      .catch(() => {
        // Fallback to cached data when offline
        const cached = localStorage.getItem('cached_projects')
        if (cached) setProjects(JSON.parse(cached))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 16 }}>My Projects</h1>
      {projects.length === 0 ? (
        <div className="empty">No projects assigned yet.</div>
      ) : (
        projects.map(p => (
          <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
            <div className="project-card-title">{p.name}</div>
            <div className="project-card-sub" style={{ marginBottom: 8 }}>
              {p.client_name || 'No client'} · {p.location || 'No location'}
            </div>
            <StatusBadge status={p.status} />
          </Link>
        ))
      )}
    </div>
  )
}
