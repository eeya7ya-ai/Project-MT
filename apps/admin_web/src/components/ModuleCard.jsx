import { Link } from 'react-router-dom'
import { MODULE_ICONS, MODULE_TYPES } from '../core/constants'

export default function ModuleCard({ projectId, type, module }) {
  return (
    <Link to={`/projects/${projectId}/modules/${type}`} className="module-card">
      <div className="module-card-icon">{MODULE_ICONS[type]}</div>
      <div className="module-card-title">{MODULE_TYPES[type]}</div>
      {module ? (
        <div className="module-card-sub">{module.items_count ?? 0} items</div>
      ) : (
        <div className="module-card-sub text-gray">Not created yet</div>
      )}
    </Link>
  )
}
