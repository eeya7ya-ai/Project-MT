import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL } from '../../core/constants'

export default function ClientLogin() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/login`, { email, password })
      localStorage.setItem('access_token',  data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      const { data: me } = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      localStorage.setItem('user_role', me.role)
      localStorage.setItem('user_name', me.full_name || me.email)
      localStorage.setItem('user_id',   me.id)

      // Cache projects for offline use
      try {
        const { data: projects } = await axios.get(`${BASE_URL}/technician/my-projects`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        localStorage.setItem('cached_projects', JSON.stringify(projects))
      } catch { /* offline optional */ }

      navigate('/projects')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

        .cl-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #030d0c;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          padding: 16px;
          box-sizing: border-box;
        }

        .cl-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          animation: cl-float 10s ease-in-out infinite;
        }
        .cl-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 70%);
          top: -150px; left: -100px;
        }
        .cl-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%);
          bottom: -120px; right: -80px;
          animation-delay: 4s;
        }
        @keyframes cl-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-20px) scale(1.05); }
        }

        .cl-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .cl-card {
          position: relative;
          width: 420px;
          max-width: calc(100vw - 32px);
          padding: 48px 44px;
          border-radius: 28px;
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 40px 100px rgba(0,0,0,0.75);
          z-index: 10;
        }

        .cl-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #0d9488, #059669);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 30px;
          margin: 0 auto 24px;
          box-shadow: 0 16px 40px rgba(13,148,136,0.45);
        }

        .cl-title {
          font-size: 26px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.6px;
          margin-bottom: 4px;
          text-align: center;
        }

        .cl-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.38);
          margin-bottom: 32px;
          line-height: 1.55;
          text-align: center;
        }

        .cl-error {
          padding: 12px 16px;
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 12px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 20px;
        }

        .cl-field {
          margin-bottom: 16px;
        }

        .cl-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          margin-bottom: 7px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .cl-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s, background 0.15s;
        }
        .cl-input::placeholder { color: rgba(255,255,255,0.22); }
        .cl-input:focus {
          border-color: rgba(13,148,136,0.6);
          background: rgba(255,255,255,0.09);
        }

        .cl-btn {
          width: 100%;
          padding: 15px;
          margin-top: 8px;
          background: linear-gradient(135deg, #0d9488 0%, #059669 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.3px;
          transition: transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 12px 32px rgba(13,148,136,0.42);
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .cl-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 18px 44px rgba(13,148,136,0.55);
        }
        .cl-btn:active:not(:disabled) { transform: translateY(0); }
        .cl-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .cl-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: cl-spin 0.65s linear infinite;
        }
        @keyframes cl-spin { to { transform: rotate(360deg); } }

        .cl-admin-link {
          margin-top: 24px;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          text-align: center;
        }
        .cl-admin-link a {
          color: rgba(255,255,255,0.32); text-decoration: none; transition: color .15s;
        }
        .cl-admin-link a:hover { color: rgba(255,255,255,0.6); }
      `}</style>

      <div className="cl-root">
        <div className="cl-orb cl-orb-1" />
        <div className="cl-orb cl-orb-2" />
        <div className="cl-grid" />

        <div className="cl-card">
          <div className="cl-icon">🔧</div>
          <div className="cl-title">Project-MT</div>
          <div className="cl-sub">Field Portal · Sign in to continue</div>

          {error && <div className="cl-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="cl-field">
              <label className="cl-label">Email</label>
              <input
                className="cl-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="cl-field">
              <label className="cl-label">Password</label>
              <input
                className="cl-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button className="cl-btn" type="submit" disabled={loading}>
              {loading ? <span className="cl-spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="cl-admin-link">
            Administrator? <a href="/admin/login">Go to Admin Portal →</a>
          </div>
        </div>
      </div>
    </>
  )
}
