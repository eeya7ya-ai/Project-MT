import { NavLink, useNavigate } from 'react-router-dom'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const name = localStorage.getItem('user_name') || 'Admin'
  const role = localStorage.getItem('user_role') || ''
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'A'

  function logout() {
    localStorage.clear()
    navigate('/admin/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Decorative top gradient */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#818cf8"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#6366f1" opacity="0.6"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#6366f1" opacity="0.6"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#818cf8" opacity="0.4"/>
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">Project-MT</div>
            <div className="sidebar-logo-sub">Admin Portal</div>
          </div>
          <div className="sidebar-status-indicator" title="System online" />
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Navigation</div>

          <NavLink
            to="/admin/projects"
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-link-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            </span>
            <span>Projects</span>
          </NavLink>

          {(role === 'admin' || role === 'dispatcher') && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <span className="sidebar-link-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="5.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                  <circle cx="11" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M1 13c0-2.485 2.015-4.5 4.5-4.5S10 10.515 10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M11 8.5c1.657 0 3 1.343 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </span>
              <span>Users</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{name}</div>
              <div className="sidebar-user-role">{role}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main" style={{ background: '#080c18' }}>{children}</main>
    </div>
  )
}
