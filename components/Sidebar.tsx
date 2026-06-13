'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { key: 'dashboard', icon: 'home', label: 'Dashboard', href: '/' },
  { key: 'leaks', icon: 'crisis_alert', label: 'จุดเงินรั่ว', href: '/leaks', badge: true },
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

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside style={{
      width: 248,
      minWidth: 248,
      height: '100vh',
      background: '#6c8298',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <Image
          src="/mewyou-logo-white.png"
          alt="Mewyou"
          width={120}
          height={36}
          style={{ objectFit: 'contain', objectPosition: 'left' }}
        />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: '#cddae4', textTransform: 'uppercase', paddingLeft: 2 }}>
          DESIGN OS
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '0 16px 12px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                height: 42,
                padding: '0 12px',
                borderRadius: 10,
                textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.95)' : 'transparent',
                color: active ? '#5f7d99' : '#cddae4',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                transition: 'background 0.15s, color 0.15s',
                position: 'relative',
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
                }}
              >
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#e05a4a',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                }}>!</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 18, color: '#cddae4', fontFamily: "'Material Symbols Rounded'", fontFeatureSettings: "'liga'" }}
            >
              person
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              mew.you studio
            </div>
            <div style={{ fontSize: 11, color: '#afc3d0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              mewyoulife@gmail.com
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
