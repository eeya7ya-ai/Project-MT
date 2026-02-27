import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../core/api'
import StatusBadge from '../components/StatusBadge'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <div className="flex gap-2">
          <input
            className="search-input"
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Link to="/projects/create" className="btn btn-primary">+ New Project</Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">No projects found.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Technicians</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.client_name || '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</td>
                    <td>{p.technician_count ?? 0}</td>
                    <td>
                      <Link to={`/projects/${p.id}`} className="btn btn-secondary btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
