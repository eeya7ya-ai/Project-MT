import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../core/api'
import StatusBadge from '../components/StatusBadge'
import { MODULE_TYPES, MODULE_ICONS } from '../core/constants'

const STATUSES = ['pending', 'in_progress', 'completed']

export default function ModuleDetail() {
  const { id, type } = useParams()
  const [module, setModule] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)

  const apiType = type.replace('_', '-')

  useEffect(() => {
    api.get(`/projects/${id}/${apiType}`)
      .then(r => {
        setModule(r.data)
        return api.get(`/${apiType}/${r.data.id}/items`)
      })
      .then(r => setItems(r.data))
      .catch(() => setError('Module not found or has no items yet.'))
      .finally(() => setLoading(false))
  }, [id, type])

  async function createModule() {
    try {
      const { data } = await api.post(`/projects/${id}/${apiType}`, {})
      setModule(data)
      setError('')
    } catch {
      setError('Failed to create module')
    }
  }

  async function addItem() {
    if (!newItem.trim() || !module) return
    setAdding(true)
    try {
      const { data } = await api.post(`/${apiType}/${module.id}/items`, { name: newItem })
      setItems(i => [...i, data])
      setNewItem('')
    } catch {
      setError('Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  async function toggleItem(item) {
    const next = item.status === 'completed' ? 'pending' : 'completed'
    try {
      await api.patch(`/${apiType}/items/${item.id}`, { status: next })
      setItems(items.map(i => i.id === item.id ? { ...i, status: next } : i))
    } catch {
      setError('Failed to update item')
    }
  }

  async function deleteItem(itemId) {
    if (!confirm('Delete this item?')) return
    try {
      await api.delete(`/${apiType}/items/${itemId}`)
      setItems(items.filter(i => i.id !== itemId))
    } catch {
      setError('Failed to delete item')
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <Link to={`/projects/${id}`} className="back-link">← Back to Project</Link>
      <div className="page-header">
        <h1 className="page-title">
          {MODULE_ICONS[type]} {MODULE_TYPES[type]}
        </h1>
        {module && (
          <Link to={`/projects/${id}/modules/${type}/import`} className="btn btn-secondary">
            📊 Import from Excel
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!module ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="text-gray mb-4">This module hasn't been created yet.</p>
          <button className="btn btn-primary" onClick={createModule}>Create Module</button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <span className="font-bold">{items.length} items</span>
              <StatusBadge status={module.status || 'pending'} />
            </div>

            {items.length === 0 ? (
              <div className="empty">No items yet. Add your first item below.</div>
            ) : (
              items.map(item => (
                <div key={item.id} className="item-row">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={item.status === 'completed'}
                    onChange={() => toggleItem(item)}
                  />
                  <span style={{ flex: 1, textDecoration: item.status === 'completed' ? 'line-through' : 'none' }}>
                    {item.name}
                  </span>
                  <StatusBadge status={item.status} />
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteItem(item.id)}
                  >×</button>
                </div>
              ))
            )}

            <div className="flex gap-2 mt-4">
              <input
                className="form-input"
                placeholder="Add new item…"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
              <button className="btn btn-primary" onClick={addItem} disabled={adding}>
                {adding ? '…' : 'Add'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
