import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api, { queueOperation } from '../core/api'
import { MODULE_TYPES, MODULE_ICONS } from '../core/constants'

export default function ModuleChecklist() {
  const { id, type } = useParams()
  const navigate = useNavigate()
  const [module, setModule] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const apiType = type.replace('_', '-')
  const cacheKey = `module_${id}_${type}`

  useEffect(() => {
    api.get(`/projects/${id}/${apiType}`)
      .then(async r => {
        setModule(r.data)
        const itemsRes = await api.get(`/${apiType}/${r.data.id}/items`)
        setItems(itemsRes.data)
        localStorage.setItem(cacheKey, JSON.stringify({ module: r.data, items: itemsRes.data }))
      })
      .catch(() => {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const { module: m, items: its } = JSON.parse(cached)
          setModule(m); setItems(its)
        }
      })
      .finally(() => setLoading(false))
  }, [id, type])

  async function toggleItem(item) {
    const next = item.status === 'completed' ? 'pending' : 'completed'
    const updated = items.map(i => i.id === item.id ? { ...i, status: next } : i)
    setItems(updated)

    // Update cache
    if (module) localStorage.setItem(cacheKey, JSON.stringify({ module, items: updated }))

    // Try API, queue if offline
    try {
      await api.patch(`/${apiType}/items/${item.id}`, { status: next })
    } catch {
      queueOperation({ method: 'patch', url: `/${apiType}/items/${item.id}`, data: { status: next } })
    }
  }

  const done = items.filter(i => i.status === 'completed').length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(`/projects/${id}`)}>← Back</button>

      <div className="page-header">
        <h1 className="page-title">{MODULE_ICONS[type]} {MODULE_TYPES[type]}</h1>
      </div>

      {items.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="flex items-center" style={{ justifyContent: 'space-between' }}>
            <span className="text-sm text-gray">{done}/{items.length} completed</span>
            <span className="font-bold" style={{ color: 'var(--primary)' }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {!module ? (
        <div className="empty">This module is not available yet.</div>
      ) : items.length === 0 ? (
        <div className="empty">No items in this module.</div>
      ) : (
        <div className="card">
          {items.map(item => (
            <div key={item.id} className="checklist-item" onClick={() => toggleItem(item)}>
              <div className={`check-circle ${item.status === 'completed' ? 'done' : ''}`}>
                {item.status === 'completed' && '✓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ textDecoration: item.status === 'completed' ? 'line-through' : 'none', color: item.status === 'completed' ? 'var(--gray-400)' : 'inherit' }}>
                  {item.name}
                </div>
                {item.description && (
                  <div className="text-sm text-gray">{item.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
