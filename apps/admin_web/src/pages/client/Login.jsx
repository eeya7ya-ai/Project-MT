import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL } from '../../core/constants'

export default function ClientLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/login`, {
        email: form.email,
        password: form.password,
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      const { data: me } = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      localStorage.setItem('user_role', me.role)
      localStorage.setItem('user_name', me.full_name || me.email)
      localStorage.setItem('user_id', me.id)

      // Cache projects for offline
      try {
        const { data: projects } = await axios.get(`${BASE_URL}/technician/my-projects`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        localStorage.setItem('cached_projects', JSON.stringify(projects))
      } catch { /* offline optional */ }

      navigate('/projects')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .cl-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #030d0c;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 16px;
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
          animation-delay: 0s;
        }
        .cl-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%);
          bottom: -120px; right: -80px;
          animation-delay: 4s;
        }
        @keyframes cl-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        .cl-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .cl-card {
          position: relative;
          display: flex;
          width: 880px;
          max-width: calc(100vw - 32px);
          min-height: 560px;
          border-radius: 28px;
          overflow: hidden;
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset;
          z-index: 10;
        }

        /* Left brand panel */
        .cl-brand {
          flex: 1;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg,
            rgba(13,148,136,0.16) 0%,
            rgba(5,150,105,0.10) 50%,
            rgba(16,185,129,0.07) 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .cl-brand-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 20% 80%, rgba(13,148,136,0.28) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(5,150,105,0.18) 0%, transparent 50%);
          pointer-events: none;
        }

        .cl-logo {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .cl-logo-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #0d9488 0%, #059669 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 10px 30px rgba(13,148,136,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset;
          flex-shrink: 0;
        }

        .cl-logo-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }

        .cl-logo-badge {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-top: 2px;
        }

        .cl-headline { position: relative; }

        .cl-headline h2 {
          font-size: 30px;
          font-weight: 700;
          line-height: 1.25;
          color: #f1f5f9;
          margin: 0 0 12px;
          letter-spacing: -0.6px;
        }

        .cl-headline h2 em {
          font-style: normal;
          background: linear-gradient(135deg, #2dd4bf, #34d399, #6ee7b7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cl-headline p {
          font-size: 13.5px;
          color: rgba(255,255,255,0.4);
          line-height: 1.7;
          max-width: 280px;
        }

        .cl-features { position: relative; display: flex; flex-direction: column; gap: 12px; }

        .cl-feature {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 500;
        }

        .cl-feature-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: linear-gradient(135deg, #0d9488, #059669);
          flex-shrink: 0;
          box-shadow: 0 0 10px rgba(13,148,136,0.7);
        }

        /* Right form panel */
        .cl-form-panel {
          width: 390px; flex-shrink: 0;
          padding: 48px 40px;
          display: flex; flex-direction: column; justify-content: center;
        }

        .cl-form-header { margin-bottom: 30px; }

        .cl-form-title {
          font-size: 26px; font-weight: 700; color: #f1f5f9;
          letter-spacing: -0.5px; margin-bottom: 7px;
        }

        .cl-form-sub { font-size: 13.5px; color: rgba(255,255,255,0.37); line-height: 1.55; }

        .cl-error {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 15px;
          background: rgba(239,68,68,0.09); border: 1px solid rgba(239,68,68,0.22);
          border-radius: 12px; margin-bottom: 20px;
          font-size: 13px; color: #fca5a5; line-height: 1.5;
        }

        .cl-field { margin-bottom: 18px; }

        .cl-label {
          display: block; font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.4); text-transform: uppercase;
          letter-spacing: 1px; margin-bottom: 8px;
        }

        .cl-input-wrap { position: relative; }

        .cl-input {
          width: 100%; padding: 13px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px; font-size: 14.5px;
          color: #f1f5f9; outline: none;
          transition: background .2s, border-color .2s, box-shadow .2s;
          font-family: inherit; caret-color: #2dd4bf;
        }

        .cl-input::placeholder { color: rgba(255,255,255,0.2); }

        .cl-input:focus {
          background: rgba(13,148,136,0.08);
          border-color: rgba(13,148,136,0.55);
          box-shadow: 0 0 0 3px rgba(13,148,136,0.15);
        }

        .cl-input.has-eye { padding-right: 48px; }

        .cl-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; padding: 4px;
          cursor: pointer; color: rgba(255,255,255,0.28);
          font-size: 16px; line-height: 1; transition: color .2s;
          display: flex; align-items: center;
        }
        .cl-eye:hover { color: rgba(255,255,255,0.6); }

        .cl-btn {
          width: 100%; padding: 15px; margin-top: 8px;
          background: linear-gradient(135deg, #0d9488 0%, #059669 100%);
          border: none; border-radius: 13px; color: #fff;
          font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: inherit;
          transition: transform .18s, box-shadow .18s, background .18s;
          box-shadow: 0 10px 28px rgba(13,148,136,0.38), 0 0 0 1px rgba(255,255,255,0.1) inset;
          display: flex; align-items: center; justify-content: center; gap: 9px;
        }
        .cl-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(13,148,136,0.5), 0 0 0 1px rgba(255,255,255,0.15) inset;
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        }
        .cl-btn:active:not(:disabled) { transform: translateY(0); }
        .cl-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .cl-spinner {
          width: 17px; height: 17px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: cl-spin .65s linear infinite; flex-shrink: 0;
        }
        @keyframes cl-spin { to { transform: rotate(360deg); } }

        .cl-admin-link {
          margin-top: 28px; padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.05);
          text-align: center; font-size: 12px; color: rgba(255,255,255,0.2);
        }
        .cl-admin-link a {
          color: rgba(255,255,255,0.3); text-decoration: none; transition: color .15s;
        }
        .cl-admin-link a:hover { color: rgba(255,255,255,0.55); }

        @media (max-width: 680px) {
          .cl-brand { display: none; }
          .cl-card { min-height: auto; }
          .cl-form-panel { width: 100%; padding: 36px 24px; }
        }
      `}</style>

      <div className="cl-root">
        <div className="cl-orb cl-orb-1" />
        <div className="cl-orb cl-orb-2" />
        <div className="cl-grid" />

        <div className="cl-card">

          {/* Left: Brand */}
          <div className="cl-brand">
            <div className="cl-brand-glow" />

            <div className="cl-logo">
              <div className="cl-logo-icon">🔧</div>
              <div>
                <div className="cl-logo-name">Project-MT</div>
                <div className="cl-logo-badge">Field Portal · v2.0</div>
              </div>
            </div>

            <div className="cl-headline">
              <h2>Track your work<br />in <em>real time</em></h2>
              <p>
                Access your assigned projects, complete checklists,
                and stay on top of your schedule — even offline.
              </p>
            </div>

            <div className="cl-features">
              {[
                'View assigned projects',
                'Complete module checklists',
                'Works offline — syncs on reconnect',
                'Schedule & upcoming visits',
              ].map(f => (
                <div key={f} className="cl-feature">
                  <div className="cl-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="cl-form-panel">
            <div className="cl-form-header">
              <div className="cl-form-title">Welcome back</div>
              <div className="cl-form-sub">Sign in to access<br />your projects and tasks</div>
            </div>

            {error && (
              <div className="cl-error">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="cl-field">
                <label className="cl-label">Email address</label>
                <div className="cl-input-wrap">
                  <input
                    className="cl-input"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="cl-field">
                <label className="cl-label">Password</label>
                <div className="cl-input-wrap">
                  <input
                    className={`cl-input has-eye`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="cl-eye"
                    onClick={() => setShowPassword(s => !s)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button className="cl-btn" type="submit" disabled={loading}>
                {loading && <span className="cl-spinner" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="cl-admin-link">
              Administrator? <a href="/admin/login">Go to Admin Portal →</a>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
