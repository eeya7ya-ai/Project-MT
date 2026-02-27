import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_EMAIL    = 'admin@projectmt.com'
const ADMIN_PASSWORD = 'Admin@1234'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('access_token', 'admin-token')
      localStorage.setItem('user_role',    'admin')
      localStorage.setItem('user_name',    'Admin')
      localStorage.setItem('user_id',      'admin-1')
      navigate('/admin/projects')
    } else {
      setError('Invalid email or password.')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        .lp-root {
          min-height:100vh; display:flex; align-items:center; justify-content:center;
          background:#060b18; position:relative; overflow:hidden;
          font-family:'Inter',sans-serif; padding:16px; box-sizing:border-box;
        }
        .lp-orb { position:absolute; border-radius:50%; filter:blur(90px); pointer-events:none; animation:lp-float 10s ease-in-out infinite; }
        .lp-orb-1 { width:600px;height:600px; background:radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%); top:-200px;left:-150px; }
        .lp-orb-2 { width:500px;height:500px; background:radial-gradient(circle,rgba(59,130,246,.14) 0%,transparent 70%); bottom:-150px;right:-100px; animation-delay:4s; }
        @keyframes lp-float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-24px) scale(1.06)} }
        .lp-grid { position:absolute;inset:0; background-image:radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; }
        .lp-card { position:relative; width:420px; max-width:calc(100vw - 32px); padding:48px 44px; border-radius:28px; background:rgba(255,255,255,.03); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,.08); box-shadow:0 40px 100px rgba(0,0,0,.7); z-index:10; }
        .lp-icon { width:64px;height:64px; background:linear-gradient(135deg,#6366f1,#3b82f6); border-radius:20px; display:flex;align-items:center;justify-content:center; font-size:30px; margin:0 auto 24px; box-shadow:0 16px 40px rgba(99,102,241,.45); }
        .lp-title { font-size:26px;font-weight:800;color:#f1f5f9;letter-spacing:-.6px;margin-bottom:4px;text-align:center; }
        .lp-sub { font-size:13px;color:rgba(255,255,255,.38);margin-bottom:32px;line-height:1.55;text-align:center; }
        .lp-error { padding:12px 16px; background:rgba(239,68,68,.09); border:1px solid rgba(239,68,68,.22); border-radius:12px; font-size:13px; color:#fca5a5; margin-bottom:20px; }
        .lp-field { margin-bottom:16px; }
        .lp-label { display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:7px;letter-spacing:.5px;text-transform:uppercase; }
        .lp-input { width:100%;padding:13px 16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#f1f5f9;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color .15s,background .15s; }
        .lp-input::placeholder { color:rgba(255,255,255,.22); }
        .lp-input:focus { border-color:rgba(99,102,241,.6);background:rgba(255,255,255,.09); }
        .lp-btn { width:100%;padding:15px;margin-top:8px;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);border:none;border-radius:14px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.3px;transition:transform .18s,box-shadow .18s;box-shadow:0 12px 32px rgba(99,102,241,.42); }
        .lp-btn:hover { transform:translateY(-2px);box-shadow:0 18px 44px rgba(99,102,241,.55); }
        .lp-btn:active { transform:translateY(0); }
        .lp-footer { margin-top:24px;font-size:12px;color:rgba(255,255,255,.18);text-align:center; }
      `}</style>

      <div className="lp-root">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-grid" />
        <div className="lp-card">
          <div className="lp-icon">📋</div>
          <div className="lp-title">Project-MT</div>
          <div className="lp-sub">Admin Portal</div>

          {error && <div className="lp-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="lp-field">
              <label className="lp-label">Email</label>
              <input className="lp-input" type="email" placeholder="admin@projectmt.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="lp-field">
              <label className="lp-label">Password</label>
              <input className="lp-input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="lp-btn" type="submit">Sign In</button>
          </form>

          <div className="lp-footer">Project-MT Admin</div>
        </div>
      </div>
    </>
  )
}
