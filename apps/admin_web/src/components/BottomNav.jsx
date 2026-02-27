import { NavLink } from 'react-router-dom'

const links = [
  { to: '/projects', icon: '📁', label: 'Projects' },
  { to: '/schedule', icon: '📅', label: 'Schedule' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <span className="nav-icon">{l.icon}</span>
          <span>{l.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
