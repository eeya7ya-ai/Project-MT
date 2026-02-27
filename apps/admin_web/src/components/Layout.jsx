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
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📋</div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">Project-MT</div>
            <div className="sidebar-logo-sub">Admin Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Navigation</div>
          <NavLink
            to="/admin/projects"
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-link-icon">📁</span>
            <span>Projects</span>
          </NavLink>
          {(role === 'admin' || role === 'dispatcher') && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <span className="sidebar-link-icon">👥</span>
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
            <span>⎋</span> Sign out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
