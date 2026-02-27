import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../core/api'
import StatusBadge from '../components/StatusBadge'
import ModuleCard from '../components/ModuleCard'
import { MODULE_TYPES } from '../core/constants'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [modules, setModules] = useState({})
  const [assignments, setAssignments] = useState([])
  const [tab, setTab] = useState('modules')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/assignments`),
      ...Object.keys(MODULE_TYPES).map(type =>
        api.get(`/projects/${id}/${type.replace('_', '-')}`).catch(() => null)
      ),
    ]).then(([projRes, assignRes, ...modResults]) => {
      setProject(projRes.data)
      setAssignments(assignRes.data)
      const modMap = {}
      Object.keys(MODULE_TYPES).forEach((type, i) => {
        if (modResults[i]) modMap[type] = modResults[i].data
      })
      setModules(modMap)
    }).catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('Delete this project? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${id}`)
      navigate('/projects')
    } catch {
      setError('Failed to delete project')
      setDeleting(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!project) return <div className="page"><div className="alert alert-error">{error}</div></div>

  return (
    <div className="page">
      <Link to="/projects" className="back-link">← Back to Projects</Link>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex gap-2">
          <Link to={`/projects/${id}/edit`} className="btn btn-secondary">Edit</Link>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="grid-2">
          <div>
            <div className="text-sm text-gray">Client</div>
            <div className="font-bold">{project.client_name || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray">Location</div>
            <div>{project.location || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray">Start Date</div>
            <div>{project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray">End Date</div>
            <div>{project.end_date ? new Date(project.end_date).toLocaleDateString() : '—'}</div>
          </div>
          {project.description && (
            <div style={{ gridColumn: '1/-1' }}>
              <div className="text-sm text-gray">Description</div>
              <div>{project.description}</div>
            </div>
          )}
        </div>
      </div>

      <div className="tab-bar">
        {['modules', 'assignments'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'modules' ? '📦 Modules' : '👷 Assignments'}
          </div>
        ))}
      </div>

      {tab === 'modules' && (
        <div className="grid-3">
          {Object.keys(MODULE_TYPES).map(type => (
            <ModuleCard key={type} projectId={id} type={type} module={modules[type]} />
          ))}
        </div>
      )}

      {tab === 'assignments' && (
        <div className="card">
          {assignments.length === 0 ? (
            <div className="empty">No technicians assigned.</div>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Assigned At</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>{a.technician_name}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
