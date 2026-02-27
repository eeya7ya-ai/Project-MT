export const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const MODULE_TYPES = {
  survey: 'Site Survey',
  maintenance: 'Maintenance',
  installation: 'Installation',
  programming_handover: 'Programming & Handover',
  handover: 'Handover / Required Files',
}

export const MODULE_ICONS = {
  survey: '🔍',
  maintenance: '🔧',
  installation: '⚡',
  programming_handover: '💻',
  handover: '📋',
}

export const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  on_hold: '#8b5cf6',
}
