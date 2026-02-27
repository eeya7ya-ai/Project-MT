import { useState, useEffect } from 'react'
import api from '../../core/api'

export default function ClientSchedule() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/technician/my-schedule')
      .then(r => {
        setSchedule(r.data)
        localStorage.setItem('cached_schedule', JSON.stringify(r.data))
      })
      .catch(() => {
        const cached = localStorage.getItem('cached_schedule')
        if (cached) setSchedule(JSON.parse(cached))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  const grouped = schedule.reduce((acc, item) => {
    const date = item.date || item.start_date || 'Unscheduled'
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 20 }}>Schedule</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📅</div>
          <div className="empty-text">No upcoming visits scheduled</div>
          <div className="empty-sub">Your schedule will appear here</div>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="section-title">
              {date === 'Unscheduled'
                ? 'Unscheduled'
                : new Date(date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div className="card">
              {items.map((item, i) => (
                <div key={i} className="cl-schedule-item">
                  <div className="cl-schedule-date">
                    <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                      {date !== 'Unscheduled' ? new Date(date).getDate() : '?'}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>
                      {date !== 'Unscheduled'
                        ? new Date(date).toLocaleDateString('en', { month: 'short' })
                        : ''}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.project_name || item.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>
                      {item.location || item.client_name || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
