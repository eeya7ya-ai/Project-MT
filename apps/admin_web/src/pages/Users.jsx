import { useState, useEffect } from 'react'
import api from '../core/api'
import StatusBadge from '../components/StatusBadge'

const ROLES = ['admin', 'dispatcher', 'technician']

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'technician' })
  const [saving, setSaving] = useState(false)

  const role = localStorage.getItem('user_role')

  useEffect(() => {
    api.get('/auth/users')
      .then(r => setUsers(r.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  async function createUser(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/auth/users', form)
      setUsers(u => [...u, data])
      setShowForm(false)
      setForm({ email: '', full_name: '', password: '', role: 'technician' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  async function deleteUser(userId) {
    if (!confirm('Delete this user?')) return
    try {
      await api.delete(`/auth/users/${userId}`)
      setUsers(u => u.filter(x => x.id !== userId))
    } catch {
      setError('Failed to delete user')
    }
  }

  if (role !== 'admin') return (
    <div className="page"><div className="alert alert-error">Access denied. Admins only.</div></div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <h2 className="section-title">Create User</h2>
          <form onSubmit={createUser}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.full_name || '—'}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-in_progress">{u.role}</span></td>
                    <td>{u.is_active ? '✅' : '❌'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>
                        Delete
                      </button>
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
