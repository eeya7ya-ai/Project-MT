import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../core/api'
import StatusBadge from '../components/StatusBadge'

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'completed', 'on_hold', 'cancelled']

const STATUS_CONFIG = {
  pending:     { color: '#f59e0b', glow: 'rgba(245,158,11,0.4)',  label: 'Pending',     icon: '⏳' },
  in_progress: { color: '#6366f1', glow: 'rgba(99,102,241,0.4)',  label: 'In Progress', icon: '⚡' },
  completed:   { color: '#10b981', glow: 'rgba(16,185,129,0.4)',  label: 'Completed',   icon: '✓'  },
  on_hold:     { color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)',  label: 'On Hold',     icon: '⏸' },
  cancelled:   { color: '#ef4444', glow: 'rgba(239,68,68,0.4)',   label: 'Cancelled',   icon: '✕'  },
}

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

function AnimatedCounter({ value }) {
  const count = useCountUp(value)
  return <>{count}</>
}

function HexGrid() {
  return (
    <svg className="eng-hex-grid" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 12 }, (_, col) =>
        Array.from({ length: 6 }, (_, row) => {
          const x = col * 70 + (row % 2 === 0 ? 0 : 35)
          const y = row * 60
          const points = Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            return `${x + 28 * Math.cos(angle)},${y + 28 * Math.sin(angle)}`
          }).join(' ')
          return (
            <polygon
              key={`${col}-${row}`}
              points={points}
              fill="none"
              stroke="rgba(99,102,241,0.12)"
              strokeWidth="0.8"
              className="eng-hex-cell"
              style={{ animationDelay: `${(col + row) * 0.15}s` }}
            />
          )
        })
      )}
    </svg>
  )
}

function ScanLine() {
  return <div className="eng-scan-line" />
}

function StatCard({ label, value, icon, color, glow, delay = 0 }) {
  return (
    <div className="eng-stat-card" style={{ '--accent': color, '--glow': glow, animationDelay: `${delay}ms` }}>
      <div className="eng-stat-icon">{icon}</div>
      <div className="eng-stat-value">
        <AnimatedCounter value={value} />
      </div>
      <div className="eng-stat-label">{label}</div>
      <div className="eng-stat-bar">
        <div className="eng-stat-bar-fill" />
      </div>
    </div>
  )
}

function ProjectCard({ project, index }) {
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.pending
  const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  return (
    <Link
      to={`/admin/projects/${project.id}`}
      className="eng-project-card"
      style={{ '--accent': cfg.color, '--glow': cfg.glow, animationDelay: `${index * 60}ms` }}
    >
      <div className="eng-card-corner eng-card-corner-tl" />
      <div className="eng-card-corner eng-card-corner-tr" />
      <div className="eng-card-corner eng-card-corner-bl" />
      <div className="eng-card-corner eng-card-corner-br" />

      <div className="eng-card-header">
        <div className="eng-card-status-dot" />
        <span className="eng-card-status-text">{cfg.icon} {cfg.label}</span>
        <span className="eng-card-id">#{String(project.id).padStart(4, '0')}</span>
      </div>

      <div className="eng-card-name">{project.name}</div>
      <div className="eng-card-client">{project.client_name || 'No client assigned'}</div>

      <div className="eng-card-meta">
        <div className="eng-card-meta-item">
          <span className="eng-card-meta-label">START</span>
          <span className="eng-card-meta-value">{startDate}</span>
        </div>
        <div className="eng-card-meta-item">
          <span className="eng-card-meta-label">CREW</span>
          <span className="eng-card-meta-value">{project.technician_count ?? 0}</span>
        </div>
      </div>

      <div className="eng-card-progress-track">
        <div className="eng-card-progress-fill" style={{ width: project.status === 'completed' ? '100%' : project.status === 'in_progress' ? '55%' : project.status === 'on_hold' ? '40%' : project.status === 'cancelled' ? '20%' : '10%' }} />
      </div>

      <div className="eng-card-glow" />
    </Link>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const inputRef = useRef()

  useEffect(() => {
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(() => setError('SYSTEM ERROR: Failed to load project data'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const countFor = s => s === 'all' ? projects.length : projects.filter(p => p.status === s).length

  const stats = [
    { label: 'Total Projects',  value: projects.length,                                              icon: '◈', color: '#6366f1', glow: 'rgba(99,102,241,0.5)'  },
    { label: 'Active',          value: countFor('in_progress'),                                      icon: '⚡', color: '#3b82f6', glow: 'rgba(59,130,246,0.5)'  },
    { label: 'Completed',       value: countFor('completed'),                                        icon: '✓',  color: '#10b981', glow: 'rgba(16,185,129,0.5)'  },
    { label: 'On Hold',         value: countFor('on_hold') + countFor('pending'),                    icon: '⏳', color: '#f59e0b', glow: 'rgba(245,158,11,0.5)'  },
  ]

  return (
    <div className="eng-page">
      <HexGrid />
      <ScanLine />

      {/* ── HEADER ── */}
      <div className="eng-header">
        <div className="eng-header-left">
          <div className="eng-breadcrumb">ADMIN / PROJECT MANAGEMENT</div>
          <h1 className="eng-title">
            <span className="eng-title-bracket">[</span>
            Project Registry
            <span className="eng-title-bracket">]</span>
          </h1>
          <div className="eng-subtitle">
            <span className="eng-pulse-dot" />
            SYSTEM ONLINE — {projects.length} RECORDS INDEXED
          </div>
        </div>
        <div className="eng-header-actions">
          <div className="eng-search-wrap">
            <span className="eng-search-icon">⌕</span>
            <input
              ref={inputRef}
              className="eng-search-input"
              placeholder="SEARCH REGISTRY…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="eng-view-toggle">
            <button className={`eng-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">⊞</button>
            <button className={`eng-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table view">☰</button>
          </div>
          <Link to="/admin/projects/create" className="eng-btn-primary">
            <span className="eng-btn-plus">+</span> NEW PROJECT
          </Link>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="eng-stats-grid">
        {stats.map((s, i) => (
          <StatCard key={s.label} delay={i * 80} {...s} />
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="eng-filter-bar">
        <span className="eng-filter-label">FILTER:</span>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            className={`eng-filter-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'ALL' : s.toUpperCase().replace('_', ' ')}
            <span className="eng-filter-count">{countFor(s)}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="eng-alert-error">
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="eng-loading">
          <div className="eng-loader-ring">
            <div /><div /><div /><div />
          </div>
          <div className="eng-loading-text">LOADING PROJECT DATA…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="eng-empty">
          <div className="eng-empty-icon">◈</div>
          <div className="eng-empty-title">NO RECORDS FOUND</div>
          <div className="eng-empty-sub">Adjust search parameters or filter criteria</div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="eng-cards-grid">
          {filtered.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
        </div>
      ) : (
        <div className="eng-table-wrap">
          <table className="eng-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>PROJECT NAME</th>
                <th>CLIENT</th>
                <th>STATUS</th>
                <th>START DATE</th>
                <th>CREW</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending
                return (
                  <tr key={p.id} className="eng-table-row" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="eng-table-id">#{String(p.id).padStart(4, '0')}</td>
                    <td>
                      <Link to={`/admin/projects/${p.id}`} className="eng-table-name">{p.name}</Link>
                    </td>
                    <td className="eng-table-muted">{p.client_name || '—'}</td>
                    <td>
                      <span className="eng-status-badge" style={{ '--accent': cfg.color, '--glow': cfg.glow }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="eng-table-muted">
                      {p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="eng-table-muted">{p.technician_count ?? 0}</td>
                    <td>
                      <Link to={`/admin/projects/${p.id}`} className="eng-table-btn">VIEW →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
