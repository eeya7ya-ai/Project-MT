import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../core/api'
import StatusBadge from '../components/StatusBadge'

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'completed', 'on_hold', 'cancelled']

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const countFor = s => s === 'all' ? projects.length : projects.filter(p => p.status === s).length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <div className="page-subtitle">{projects.length} total</div>
        </div>
        <div className="flex gap-2">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link to="/admin/projects/create" className="btn btn-primary">+ New Project</Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-bar">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
            <span className="filter-pill-count">{countFor(s)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <div className="empty-text">No projects found</div>
          <div className="empty-sub">Try a different search or filter</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                    <td>
                      <Link to={`/admin/projects/${p.id}`} className="project-name-link">
                        {p.name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.client_name || '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.technician_count ?? 0}</td>
                    <td>
                      <Link to={`/admin/projects/${p.id}`} className="btn btn-secondary btn-sm">View</Link>
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
