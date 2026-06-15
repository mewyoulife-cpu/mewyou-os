'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from './ThemeContext'
import { useI18n } from './I18nContext'

async function logout(router: ReturnType<typeof useRouter>, confirmMsg: string) {
  if (!confirm(confirmMsg)) return
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // ignore — still redirect to login
  }
  router.replace('/login')
}

const NAV_ITEMS = [
  { key: 'dashboard', icon: 'home', label: 'หน้าหลัก', href: '/' },
  { key: 'leaks', icon: 'crisis_alert', label: 'จุดเงินรั่ว', href: '/leaks' },
  { key: 'projects', icon: 'folder_open', label: 'Projects', href: '/projects' },
  { key: 'customers', icon: 'group', label: 'Customers', href: '/customers' },
  { key: 'calendar', icon: 'calendar_month', label: 'Calendar', href: '/calendar' },
  { key: 'quotation', icon: 'request_quote', label: 'Quotation', href: '/quotation' },
  { key: 'documents', icon: 'receipt_long', label: 'Documents', href: '/documents' },
  { key: 'finance', icon: 'bar_chart', label: 'Finance', href: '/finance' },
  { key: 'files', icon: 'folder_zip', label: 'Files', href: '/files' },
  { key: 'settings', icon: 'settings', label: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useI18n()
  const glass = theme === 'glass'
  const [brandLogo, setBrandLogo] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => { if (s?.brandLogo) setBrandLogo(s.brandLogo) }).catch(() => {})
  }, [])

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // Theme-aware palette (glass = light frosted sidebar with dark text).
  const navIdle = glass ? '#51606e' : '#cddae4'
  const navActiveBg = glass ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.95)'
  const navActiveColor = glass ? '#3d6e8e' : '#5f7d99'
  const subColor = glass ? '#62707c' : '#cddae4'
  const profileBg = glass ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,.12)'
  const nameColor = glass ? '#2f3b45' : '#ffffff'

  return (
    <aside style={{
      width: 248,
      flexShrink: 0,
      background: '#6c8298',
      display: 'flex',
      flexDirection: 'column',
      padding: '22px 16px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 0 28px' }}>
        {brandLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brandLogo} alt="logo" style={{ maxWidth: 170, maxHeight: 56, objectFit: 'contain', display: 'block' }} />
        ) : (
          <Image
            src="/mewyou-logo-white.png"
            alt="mewyou"
            width={150}
            height={46}
            style={{ objectFit: 'contain', display: 'block', filter: glass ? 'invert(0.72)' : undefined }}
          />
        )}
        <div style={{ fontSize: 8.5, letterSpacing: 4, color: subColor, fontWeight: 600 }}>
          DESIGN OS
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 12px',
                height: 40,
                borderRadius: 10,
                textDecoration: 'none',
                background: active ? navActiveBg : 'transparent',
                color: active ? navActiveColor : navIdle,
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{
                  fontSize: 20,
                  fontFamily: "'Material Symbols Rounded'",
                  fontFeatureSettings: "'liga'",
                  lineHeight: 1,
                  flexShrink: 0,
                  color: active ? navActiveColor : navIdle,
                }}
              >
                {item.icon}
              </span>
              <span>{t(item.label)}</span>
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 14, background: profileBg, marginTop: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#cdd9e3,#a9bccd)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#54697d', fontSize: 15 }}>
          M
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mewyou Studio</div>
          <div style={{ fontSize: 11.5, color: subColor }}>Owner · Admin</div>
        </div>
        <span onClick={() => logout(router, t('ออกจากระบบ?'))} title={t('ออกจากระบบ')} className="material-symbols-rounded" style={{ fontSize: 20, color: subColor, cursor: 'pointer', fontFamily: "'Material Symbols Rounded'", fontFeatureSettings: "'liga'" }}>logout</span>
      </div>
    </aside>
  )
}
