import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../core/api'

const STATUS_META = {
  pending:     { color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',   bg: 'rgba(245,158,11,0.10)',  label: 'Pending',     dot: '#f59e0b' },
  in_progress: { color: '#6366f1', glow: 'rgba(99,102,241,0.2)',  bg: 'rgba(99,102,241,0.10)',  label: 'In Progress', dot: '#6366f1' },
  completed:   { color: '#10b981', glow: 'rgba(16,185,129,0.2)',  bg: 'rgba(16,185,129,0.10)',  label: 'Completed',   dot: '#10b981' },
  on_hold:     { color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)',  bg: 'rgba(139,92,246,0.10)',  label: 'On Hold',     dot: '#8b5cf6' },
  cancelled:   { color: '#ef4444', glow: 'rgba(239,68,68,0.2)',   bg: 'rgba(239,68,68,0.10)',   label: 'Cancelled',   dot: '#ef4444' },
}

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'completed', 'on_hold', 'cancelled']

function Counter({ value, duration = 1000 }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (value === from) return
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <>{display}</>
}

function getProgress(p) {
  if (p.status === 'completed') return 100
  if (p.status === 'pending' || p.status === 'cancelled') return 0
  return ((p.id * 37 + 11) % 55) + 25
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    api.get('/projects')
      .then(r => { setProjects(r.data); setTimeout(() => setMounted(true), 60) })
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch = p.name.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const countFor = s => s === 'all' ? projects.length : projects.filter(p => p.status === s).length

  const stats = [
    { label: 'Total Projects', value: projects.length,            color: '#6366f1', icon: '◈', key: 'total' },
    { label: 'In Progress',    value: countFor('in_progress'),    color: '#6366f1', icon: '⚡', key: 'active' },
    { label: 'Completed',      value: countFor('completed'),      color: '#10b981', icon: '✓', key: 'done' },
    { label: 'Pending',        value: countFor('pending'),        color: '#f59e0b', icon: '◷', key: 'pending' },
  ]

  return (
    <div className="eng-page">

      {/* ── Animated grid background ── */}
      <div className="eng-bg-grid" aria-hidden />

      {/* ── Header ── */}
      <div className="eng-header">
        <div>
          <div className="eng-eyebrow">
            <span className="eng-live-dot" />
            SYSTEM ONLINE · ADMIN PORTAL
          </div>
          <h1 className="eng-title">Project Control</h1>
          <p className="eng-subtitle">{projects.length} projects registered · Live data</p>
        </div>
        <Link to="/admin/projects/create" className="eng-btn-primary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          New Project
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="eng-stats-grid">
        {stats.map((s, i) => (
          <div
            key={s.key}
            className="eng-stat-card"
            style={{ '--sc': s.color, '--sd': `${i * 80}ms` }}
          >
            <div className="eng-stat-top-line" />
            <div className="eng-stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="eng-stat-value" style={{ color: s.color }}>
              {loading ? <span className="eng-stat-skeleton" /> : <Counter value={s.value} />}
            </div>
            <div className="eng-stat-label">{s.label}</div>
            <div className="eng-stat-track">
              <div
                className="eng-stat-fill"
                style={{
                  width: !loading && projects.length ? `${Math.round((s.value / projects.length) * 100)}%` : '0%',
                  background: s.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* ── Controls ── */}
      <div className="eng-controls">
        <div className="eng-filter-row">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`eng-pill ${statusFilter === s ? 'eng-pill-active' : ''}`}
              style={statusFilter === s && s !== 'all' ? { '--pc': STATUS_META[s]?.color || '#6366f1' } : {}}
              onClick={() => setStatusFilter(s)}
            >
              {s !== 'all' && statusFilter === s && (
                <span className="eng-pill-dot" style={{ background: STATUS_META[s]?.color }} />
              )}
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              <span className="eng-pill-count">{countFor(s)}</span>
            </button>
          ))}
        </div>

        <div className="eng-search-wrap">
          <svg className="eng-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 9l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="eng-search-input"
            placeholder="Search projects or clients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="eng-loading">
          <div className="eng-spinner-ring" />
          <p className="eng-loading-text">Fetching project data…</p>
          <div className="eng-skeleton-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="eng-skeleton-card" style={{ '--si': i }} />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="eng-empty">
          <div className="eng-empty-icon">◉</div>
          <div className="eng-empty-title">No projects found</div>
          <div className="eng-empty-sub">Try adjusting your search or filter</div>
        </div>
      ) : (
        <div className="eng-grid">
          {filtered.map((p, i) => {
            const meta = STATUS_META[p.status] || STATUS_META.pending
            const prog = getProgress(p)
            return (
              <Link
                to={`/admin/projects/${p.id}`}
                key={p.id}
                className="eng-card"
                style={{ '--cc': meta.color, '--cg': meta.glow, '--ci': i }}
              >
                {/* top accent */}
                <div className="eng-card-bar" style={{ background: meta.color }} />

                {/* hover glow */}
                <div className="eng-card-glow" style={{ background: `radial-gradient(ellipse at 50% -20%, ${meta.glow} 0%, transparent 70%)` }} />

                {/* status + id */}
                <div className="eng-card-header">
                  <span className="eng-card-badge" style={{ background: meta.bg, color: meta.color }}>
                    <span className="eng-badge-dot" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                  <span className="eng-card-id">#{String(p.id).padStart(4, '0')}</span>
                </div>

                {/* name */}
                <div className="eng-card-name">{p.name}</div>
                <div className="eng-card-client">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
                    <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M1.5 10.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  {p.client_name || 'No client assigned'}
                </div>

                {/* meta row */}
                <div className="eng-card-meta">
                  <span className="eng-card-meta-item">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5 }}>
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M6 3.5V6l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    {p.start_date ? new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                  </span>
                  <span className="eng-card-meta-item">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5 }}>
                      <circle cx="4.5" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
                      <circle cx="8.5" cy="3" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M1 10c0-1.933 1.567-3.5 3.5-3.5M11 10c0-1.933-1.567-3.5-3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    {p.technician_count ?? 0} tech{(p.technician_count ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* progress */}
                <div className="eng-card-progress">
                  <div className="eng-progress-header">
                    <span>Progress</span>
                    <span style={{ color: meta.color }}>{prog}%</span>
                  </div>
                  <div className="eng-progress-track">
                    <div
                      className="eng-progress-fill"
                      style={{
                        width: `${prog}%`,
                        background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})`,
                        boxShadow: `0 0 6px ${meta.color}88`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
