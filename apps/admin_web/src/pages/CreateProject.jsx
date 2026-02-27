import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../core/api'

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']

export default function CreateProject() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({
    name: '', client_name: '', location: '', description: '',
    status: 'pending', start_date: '', end_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      api.get(`/projects/${id}`).then(r => {
        const p = r.data
        setForm({
          name: p.name || '',
          client_name: p.client_name || '',
          location: p.location || '',
          description: p.description || '',
          status: p.status || 'pending',
          start_date: p.start_date ? p.start_date.slice(0, 10) : '',
          end_date: p.end_date ? p.end_date.slice(0, 10) : '',
        })
      }).catch(() => setError('Failed to load project'))
    }
  }, [id])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = { ...form, start_date: form.start_date || null, end_date: form.end_date || null }
    try {
      if (isEdit) {
        await api.patch(`/projects/${id}`, payload)
        navigate(`/admin/projects/${id}`)
      } else {
        const { data } = await api.post('/projects', payload)
        navigate(`/admin/projects/${data.id}`)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Link to={isEdit ? `/admin/projects/${id}` : '/admin/projects'} className="back-link">← Back</Link>
      <h1 className="page-title">{isEdit ? 'Edit Project' : 'New Project'}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Client Name</label>
              <input className="form-input" value={form.client_name} onChange={set('client_name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={set('location')} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
            <Link to={isEdit ? `/admin/projects/${id}` : '/admin/projects'} className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
