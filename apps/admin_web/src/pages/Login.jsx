import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL } from '../core/constants'

export default function Login() {
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
      // FIX: send JSON body with 'email' field matching the backend LoginRequest schema
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
      navigate('/admin/projects')
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

        .lp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #060b18;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Animated background orbs */
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
          animation-delay: 0s;
        }
        .lp-orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%);
          bottom: -150px; right: -100px;
          animation-delay: 4s;
        }
        .lp-orb-3 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          top: 40%; left: 55%;
          animation-delay: 7s;
        }
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-24px) scale(1.06); }
        }

        /* Subtle dot grid */
        .lp-grid {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* Card */
        .lp-card {
          position: relative;
          display: flex;
          width: 920px;
          max-width: calc(100vw - 32px);
          min-height: 580px;
          border-radius: 28px;
          overflow: hidden;
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow:
            0 40px 100px rgba(0,0,0,0.7),
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 1px 0 rgba(255,255,255,0.08) inset;
          z-index: 10;
        }

        /* ── Left branding panel ── */
        .lp-brand {
          flex: 1;
          padding: 52px 44px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg,
            rgba(99,102,241,0.14) 0%,
            rgba(59,130,246,0.10) 50%,
            rgba(139,92,246,0.08) 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        .lp-brand-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 80%, rgba(99,102,241,0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.18) 0%, transparent 50%);
          pointer-events: none;
        }

        .lp-logo {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .lp-logo-icon {
          width: 54px; height: 54px;
          background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          box-shadow: 0 10px 30px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset;
          flex-shrink: 0;
        }

        .lp-logo-text { line-height: 1; }

        .lp-logo-name {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-logo-badge {
          margin-top: 3px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }

        .lp-headline {
          position: relative;
        }

        .lp-headline h2 {
          font-size: 34px;
          font-weight: 700;
          line-height: 1.22;
          color: #f1f5f9;
          margin: 0 0 14px;
          letter-spacing: -0.8px;
        }

        .lp-headline h2 em {
          font-style: normal;
          background: linear-gradient(135deg, #818cf8, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-headline p {
          font-size: 14px;
          color: rgba(255,255,255,0.42);
          line-height: 1.72;
          margin: 0;
          max-width: 290px;
        }

        .lp-features {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .lp-feature {
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          font-weight: 500;
        }

        .lp-feature-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          flex-shrink: 0;
          box-shadow: 0 0 10px rgba(99,102,241,0.7);
        }

        /* ── Right form panel ── */
        .lp-form-panel {
          width: 400px;
          flex-shrink: 0;
          padding: 52px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .lp-form-header {
          margin-bottom: 34px;
        }

        .lp-form-title {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.6px;
          margin-bottom: 8px;
        }

        .lp-form-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.38);
          line-height: 1.55;
        }

        /* Error */
        .lp-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px 16px;
          background: rgba(239,68,68,0.09);
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 12px;
          margin-bottom: 22px;
          font-size: 13px;
          color: #fca5a5;
          line-height: 1.5;
        }

        .lp-error-icon {
          font-size: 15px;
          margin-top: 1px;
          flex-shrink: 0;
        }

        /* Input */
        .lp-field { margin-bottom: 20px; }

        .lp-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 9px;
        }

        .lp-input-wrap { position: relative; }

        .lp-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          font-size: 15px;
          color: #f1f5f9;
          outline: none;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          caret-color: #818cf8;
        }

        .lp-input::placeholder { color: rgba(255,255,255,0.2); }

        .lp-input:focus {
          background: rgba(99,102,241,0.07);
          border-color: rgba(99,102,241,0.55);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.14);
        }

        .lp-input.has-eye { padding-right: 48px; }

        .lp-eye {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: rgba(255,255,255,0.28);
          font-size: 16px;
          line-height: 1;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .lp-eye:hover { color: rgba(255,255,255,0.6); }

        /* Submit */
        .lp-btn {
          width: 100%;
          padding: 16px;
          margin-top: 10px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none;
          border-radius: 13px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.2px;
          font-family: inherit;
          transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
          box-shadow: 0 10px 28px rgba(99,102,241,0.38), 0 0 0 1px rgba(255,255,255,0.1) inset;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(99,102,241,0.5), 0 0 0 1px rgba(255,255,255,0.15) inset;
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .lp-spinner {
          width: 17px; height: 17px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lp-spin 0.65s linear infinite;
          flex-shrink: 0;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        /* Footer */
        .lp-footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          line-height: 1.6;
        }

        /* Responsive */
        @media (max-width: 720px) {
          .lp-brand { display: none; }
          .lp-card { min-height: auto; }
          .lp-form-panel { width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        <div className="lp-grid" />

        <div className="lp-card">

          {/* ── Left: Branding ── */}
          <div className="lp-brand">
            <div className="lp-brand-glow" />

            <div className="lp-logo">
              <div className="lp-logo-icon">📋</div>
              <div className="lp-logo-text">
                <div className="lp-logo-name">Project-MT</div>
                <div className="lp-logo-badge">Admin Portal · v2.0</div>
              </div>
            </div>

            <div className="lp-headline">
              <h2>Manage projects<br />with <em>precision</em></h2>
              <p>
                A unified platform for field operations — track maintenance,
                installation, and handover from a single command center.
              </p>
            </div>

            <div className="lp-features">
              {[
                'Real-time project tracking',
                'Team assignment & dispatch',
                'Multi-module field reports',
                'Digital handover & e-signatures',
              ].map(f => (
                <div key={f} className="lp-feature">
                  <div className="lp-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="lp-form-panel">
            <div className="lp-form-header">
              <div className="lp-form-title">Welcome back</div>
              <div className="lp-form-sub">Sign in to your admin account<br />to access the portal</div>
            </div>

            {error && (
              <div className="lp-error">
                <span className="lp-error-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="lp-field">
                <label className="lp-label">Email address</label>
                <div className="lp-input-wrap">
                  <input
                    className="lp-input"
                    type="email"
                    placeholder="admin@projectmt.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <input
                    className={`lp-input${showPassword ? '' : ' has-eye'} has-eye`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPassword(s => !s)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button className="lp-btn" type="submit" disabled={loading}>
                {loading && <span className="lp-spinner" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="lp-footer">
              Project-MT Admin Portal &nbsp;·&nbsp; Secured with JWT
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
