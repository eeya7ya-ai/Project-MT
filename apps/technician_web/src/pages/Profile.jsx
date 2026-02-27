import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { flushQueue, getQueue } from '../core/api'

export default function Profile() {
  const navigate = useNavigate()
  const name = localStorage.getItem('user_name') || 'Technician'
  const role = localStorage.getItem('user_role') || 'technician'
  const queue = getQueue()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  async function sync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await flushQueue()
      setSyncResult(result)
    } finally {
      setSyncing(false)
    }
  }

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 16 }}>Profile</h1>

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="profile-avatar">{initials}</div>
        <div className="font-bold" style={{ fontSize: 18 }}>{name}</div>
        <div className="text-sm text-gray" style={{ textTransform: 'capitalize' }}>{role}</div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>Sync</div>
        {queue.length > 0 ? (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            ⚠️ {queue.length} offline change{queue.length !== 1 ? 's' : ''} waiting to sync
          </div>
        ) : (
          <div className="text-sm text-gray mb-2">All changes are synced.</div>
        )}
        {syncResult && (
          <div className="alert alert-success">
            ✅ Synced {syncResult.synced} items{syncResult.failed ? `, ${syncResult.failed} failed` : ''}
          </div>
        )}
        <button className="btn btn-primary btn-full" onClick={sync} disabled={syncing || queue.length === 0}>
          {syncing ? '⟳ Syncing…' : '↑ Sync Now'}
        </button>
      </div>

      <div className="card">
        <button className="btn btn-secondary btn-full" onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
