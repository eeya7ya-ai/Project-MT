import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL } from '../core/constants'

const DEFAULT_EMAIL    = 'admin@projectmt.com'
const DEFAULT_PASSWORD = 'Admin@1234'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEnter() {
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/login`, {
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
      })
      localStorage.setItem('access_token',  data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      const { data: me } = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      localStorage.setItem('user_role', me.role)
      localStorage.setItem('user_name', me.full_name || me.email)
      localStorage.setItem('user_id',   me.id)
      navigate('/admin/projects')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

        .lp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #060b18;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .lp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          animation: lp-float 10s ease-in-out infinite;
        }
        .lp-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          top: -200px; left: -150px;
        }
        .lp-orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%);
          bottom: -150px; right: -100px;
          animation-delay: 4s;
        }
        @keyframes lp-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-24px) scale(1.06); }
        }

        .lp-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .lp-card {
          position: relative;
          width: 420px;
          max-width: calc(100vw - 32px);
          padding: 56px 48px;
          border-radius: 28px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 40px 100px rgba(0,0,0,0.7);
          text-align: center;
          z-index: 10;
        }

        .lp-icon {
          width: 72px; height: 72px;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          font-size: 34px;
          margin: 0 auto 28px;
          box-shadow: 0 16px 40px rgba(99,102,241,0.45);
        }

        .lp-title {
          font-size: 28px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.6px;
          margin-bottom: 8px;
        }

        .lp-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.38);
          margin-bottom: 40px;
          line-height: 1.55;
        }

        .lp-error {
          padding: 12px 16px;
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 12px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 24px;
        }

        .lp-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.3px;
          transition: transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 12px 32px rgba(99,102,241,0.42);
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 18px 44px rgba(99,102,241,0.55);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .lp-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lp-spin 0.65s linear infinite;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        .lp-footer {
          margin-top: 28px;
          font-size: 12px;
          color: rgba(255,255,255,0.18);
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-grid" />

        <div className="lp-card">
          <div className="lp-icon">📋</div>
          <div className="lp-title">Project-MT</div>
          <div className="lp-sub">Admin Portal · v2.0<br />Click to enter the dashboard</div>

          {error && <div className="lp-error">⚠ {error}</div>}

          <button className="lp-btn" onClick={handleEnter} disabled={loading}>
            {loading ? <span className="lp-spinner" /> : '→'}
            {loading ? 'Entering…' : 'Enter Admin Portal'}
          </button>

          <div className="lp-footer">Project-MT · Secured with JWT</div>
        </div>
      </div>
    </>
  )
}
