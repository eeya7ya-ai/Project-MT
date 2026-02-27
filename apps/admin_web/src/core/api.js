import axios from 'axios'
import { BASE_URL } from './constants'

const api = axios.create({ baseURL: BASE_URL })

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh })
        localStorage.setItem('access_token', data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        localStorage.clear()
        const isAdminPath = window.location.pathname.startsWith('/admin')
        window.location.href = isAdminPath ? '/admin/login' : '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Offline queue ─────────────────────────────────────────
const QUEUE_KEY = 'offline_queue'

export function queueOperation(op) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  queue.push({ ...op, timestamp: Date.now() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getQueue() {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
}

export async function flushQueue() {
  const queue = getQueue()
  if (!queue.length) return { synced: 0, failed: 0 }
  let synced = 0, failed = 0
  const remaining = []
  for (const op of queue) {
    try {
      await api({ method: op.method, url: op.url, data: op.data })
      synced++
    } catch {
      remaining.push(op)
      failed++
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  return { synced, failed }
}

export default api
