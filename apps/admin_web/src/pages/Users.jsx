import { useState, useEffect } from 'react'

const ROLES = ['technician', 'dispatcher', 'admin']
const STORAGE_KEY = 'local_users'

function loadUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export default function Users() {
  const [users, setUsers]       = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ email: '', full_name: '', password: '', role: 'technician' })
  const [error, setError]       = useState('')

  const role = localStorage.getItem('user_role')

  useEffect(() => {
    setUsers(loadUsers())
  }, [])

  function createUser(e) {
    e.preventDefault()
    setError('')
    const existing = users.find(u => u.email === form.email)
    if (existing) { setError('Email already exists.'); return }

    const newUser = {
      id:        Date.now().toString(),
      email:     form.email,
      full_name: form.full_name,
      password:  form.password,
      role:      form.role,
      is_active: true,
    }
    const updated = [...users, newUser]
    saveUsers(updated)
    setUsers(updated)
    setShowForm(false)
    setForm({ email: '', full_name: '', password: '', role: 'technician' })
  }

  function deleteUser(id) {
    if (!confirm('Delete this user?')) return
    const updated = users.filter(u => u.id !== id)
    saveUsers(updated)
    setUsers(updated)
  }

  function toggleActive(id) {
    const updated = users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u)
    saveUsers(updated)
    setUsers(updated)
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
            <button className="btn btn-primary" type="submit">Create User</button>
          </form>
        </div>
      )}

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
              {users.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '24px' }}>No users yet. Click "+ New User" to add one.</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name || '—'}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-in_progress">{u.role}</span></td>
                  <td>
                    <button onClick={() => toggleActive(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                      {u.is_active ? '✅' : '❌'}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
