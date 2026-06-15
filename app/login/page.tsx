'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Compact money formatter to match the design (฿2.4M, ฿155K, ฿1,200).
function formatSales(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${Math.round(n / 1_000)}K`
  return `฿${n.toLocaleString('en-US')}`
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/'

  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<{ projectCount: number; salesThisYear: number } | null>(null)

  // Live studio stats overlaid on the background — refreshed from the database.
  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/public/stats', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (alive && d) setStats(d) })
        .catch(() => {})
    load()
    const t = setInterval(load, 30000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, remember: true }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')
        setLoading(false)
        return
      }
      router.replace(next)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setLoading(false)
    }
  }

  const label: React.CSSProperties = {
    display: 'block', fontSize: 12.5, fontWeight: 600, color: '#ffffff', marginBottom: 7,
  }
  const fieldWrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 11,
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: 13, height: 50, padding: '0 15px',
  }
  const input: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: 'inherit', fontSize: 14.5, color: '#ffffff',
  }

  return (
    <div className="login-bg">
      {/* Headline overlay (top) */}
      <div className="login-overlay login-headline">
        <div style={{ fontSize: 27, fontWeight: 500, lineHeight: 1.15, marginBottom: 2 }}>Design management</div>
        <div style={{ fontSize: 18, fontWeight: 400, opacity: 1 }}>built for your studio</div>
        <div style={{ fontSize: 15, fontWeight: 400, opacity: 1, marginTop: 4, maxWidth: 760 }}>
          Manage projects, clients, quotations, and finances all in one place. Run every packaging design job with a clear system.
        </div>
      </div>

      {/* Live stat — left */}
      <div className="login-overlay login-stat-left">
        <div style={{ fontSize: 52, fontWeight: 400, lineHeight: 1, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {stats ? stats.projectCount : '—'}
        </div>
        <div style={{ fontSize: 17, fontWeight: 400, marginTop: 6, opacity: 1 }}>Projects</div>
      </div>

      {/* Live stat — right */}
      <div className="login-overlay login-stat-right">
        <div style={{ fontSize: 52, fontWeight: 400, lineHeight: 1, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {stats ? formatSales(stats.salesThisYear) : '—'}
        </div>
        <div style={{ fontSize: 17, fontWeight: 400, marginTop: 6, opacity: 1 }}>Sales this year</div>
      </div>

      {/* Copyright */}
      <div className="login-overlay login-copyright">© 2026 Mewyou Design Studio · packaging design</div>

      {/* Glass card */}
      <form onSubmit={submit} className="login-glass">
        {/* Logo */}
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.05, fontWeight: 500, fontSize: 19, color: '#ffffff', marginBottom: 26 }}>
          <div>mew.</div>
          <div style={{ marginLeft: 16 }}>you</div>
        </div>

        <div style={{ fontSize: 30, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>Welcome back</div>
        <div style={{ fontSize: 14, color: '#ffffff', lineHeight: 1.45, marginBottom: 26 }}>
          Please login to your account<br />to continue
        </div>

        {/* Email */}
        <label style={label}>Email</label>
        <div style={{ ...fieldWrap, marginBottom: 18 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#ffffff' }}>mail</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@mewyou.studio" style={input} autoComplete="username" />
        </div>

        {/* Password */}
        <label style={label}>Password</label>
        <div style={{ ...fieldWrap, marginBottom: 12 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#ffffff' }}>lock</span>
          <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={input} autoComplete="current-password" />
          <span onClick={() => setShowPw(v => !v)} className="material-symbols-rounded" style={{ fontSize: 19, color: '#ffffff', cursor: 'pointer' }}>{showPw ? 'visibility_off' : 'visibility'}</span>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#ffffff', textDecoration: 'underline', cursor: 'pointer' }}>Forgot password?</span>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(190,72,55,0.40)', color: '#ffffff', borderRadius: 11, padding: '10px 13px', fontSize: 13, marginBottom: 16 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', height: 52, border: 'none', borderRadius: 13,
          background: loading ? '#8a98ac' : '#6f8198', color: '#fff', fontSize: 15.5, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          boxShadow: '0 8px 22px rgba(95,125,153,.32)', fontFamily: 'inherit',
        }}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
          {!loading && <span className="material-symbols-rounded" style={{ fontSize: 19 }}>arrow_forward</span>}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#ffffff' }}>
          Don&apos;t have an account? <span style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>Sign up</span>
        </div>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
