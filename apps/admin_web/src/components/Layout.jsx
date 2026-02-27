import { NavLink, useNavigate } from 'react-router-dom'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const name = localStorage.getItem('user_name') || 'Admin'
  const role = localStorage.getItem('user_role') || ''

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">📋 Project-MT</div>
        <nav className="sidebar-nav">
          <NavLink to="/projects" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            📁 Projects
          </NavLink>
          {(role === 'admin' || role === 'dispatcher') && (
            <NavLink to="/users" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
              👥 Users
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{name} · {role}</div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
