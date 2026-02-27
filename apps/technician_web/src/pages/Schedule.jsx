import { useState, useEffect } from 'react'
import api from '../core/api'

export default function Schedule() {
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

  // Group by date
  const grouped = schedule.reduce((acc, item) => {
    const date = item.date || item.start_date || 'Unscheduled'
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 16 }}>Schedule</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty">No upcoming scheduled visits.</div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="section-title">
              {date === 'Unscheduled' ? date : new Date(date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <div className="card">
              {items.map((item, i) => (
                <div key={i} className="schedule-item">
                  <div className="schedule-date">
                    {date !== 'Unscheduled' ? new Date(date).getDate() : '?'}
                    <div style={{ fontSize: 10 }}>
                      {date !== 'Unscheduled' ? new Date(date).toLocaleDateString('en', { month: 'short' }) : ''}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-bold">{item.project_name || item.name}</div>
                    <div className="text-sm text-gray">{item.location || item.client_name || ''}</div>
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
