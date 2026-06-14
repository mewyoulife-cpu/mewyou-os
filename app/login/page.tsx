'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Compact money formatter to match the design (฿2.4M, ฿850K, ฿1,200).
function formatSales(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${Math.round(n / 1_000)}K`
  return `฿${n.toLocaleString('en-US')}`
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<{ projectCount: number; salesThisYear: number } | null>(null)

  // Live studio stats for the left panel — refreshed from the database.
  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/public/stats', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (alive && d) setStats(d) })
        .catch(() => {})
    load()
    const t = setInterval(load, 30000) // keep it fresh while the page is open
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
        body: JSON.stringify({ password, remember }),
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

  const fieldWrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, background: '#fff',
    border: '1px solid #e1e6ea', borderRadius: 12, height: 52, padding: '0 15px',
  }
  const input: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: 'inherit', fontSize: 14.5, color: '#2f3b45',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#eef1f4' }}>
      {/* Left decorative panel */}
      <div className="login-aside" style={{
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '54px 56px',
        background: 'linear-gradient(155deg, #a4b8c8 0%, #87a0b4 55%, #7a93a8 100%)',
        color: '#fff', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.05, fontWeight: 500, fontSize: 26, letterSpacing: '.5px' }}>
          <div style={{ fontStyle: 'italic' }}>mew.</div>
          <div style={{ fontStyle: 'italic', marginLeft: 18 }}>you</div>
        </div>

        {/* Headline */}
        <div>
          <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.18, marginBottom: 18, letterSpacing: '-.5px' }}>
            Design management<br />built for your studio
          </div>
          <div style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,.82)', maxWidth: 460 }}>
            Manage projects, clients, quotations, and finances all in one place.
            Run every packaging design job with a clear system.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 40 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {stats ? stats.projectCount : '—'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.78)' }}>Projects</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,.3)' }} />
            <div>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {stats ? formatSales(stats.salesThisYear) : '—'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.78)' }}>Sales this year</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)' }}>
          © 2026 Mewyou Design Studio · packaging design
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 28px' }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2a33', marginBottom: 6 }}>Welcome back 👋</div>
          <div style={{ fontSize: 14.5, color: '#7a8893', marginBottom: 30 }}>Sign in to manage your design work</div>

          {/* Email */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3b4954', marginBottom: 7 }}>Email</label>
          <div style={{ ...fieldWrap, marginBottom: 18 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>mail</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@mewyou.studio" style={input} autoComplete="username" />
          </div>

          {/* Password */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3b4954', marginBottom: 7 }}>Password</label>
          <div style={{ ...fieldWrap, marginBottom: 16 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>lock</span>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={input} autoComplete="current-password" />
            <span onClick={() => setShowPw(v => !v)} className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2', cursor: 'pointer' }}>{showPw ? 'visibility_off' : 'visibility'}</span>
          </div>

          {/* Remember / forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, color: '#5b6b77' }}>
              <span onClick={() => setRemember(v => !v)} style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: remember ? '#5f7d99' : '#fff', border: remember ? '1px solid #5f7d99' : '1px solid #cdd6df',
              }}>
                {remember && <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#fff' }}>check</span>}
              </span>
              Remember me
            </label>
            <span style={{ fontSize: 13.5, color: '#5f7d99', fontWeight: 600, cursor: 'pointer' }}>Forgot password?</span>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fceee8', color: '#c4593f', borderRadius: 10, padding: '11px 13px', fontSize: 13, marginBottom: 16, border: '1px solid #f6dfd6' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', height: 52, border: 'none', borderRadius: 12,
            background: '#5f7d99', color: '#fff', fontSize: 15.5, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 6px 16px rgba(95,125,153,.32)', fontFamily: 'inherit',
          }}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'Sign in'}
            {!loading && <span className="material-symbols-rounded" style={{ fontSize: 20 }}>arrow_forward</span>}
          </button>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: '#7a8893' }}>
            Don&apos;t have an account? <span style={{ color: '#5f7d99', fontWeight: 600 }}>Contact your administrator</span>
          </div>
        </form>
      </div>
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
