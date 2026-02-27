export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const MODULE_TYPES = {
  survey: 'Site Survey',
  maintenance: 'Maintenance',
  installation: 'Installation',
  programming_handover: 'Programming & Handover',
  handover: 'Handover / Files',
}

export const MODULE_ICONS = {
  survey: '🔍',
  maintenance: '🔧',
  installation: '⚡',
  programming_handover: '💻',
  handover: '📋',
}
