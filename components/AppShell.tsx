'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import BrandApplier from '@/components/BrandApplier'
import { ThemeProvider, useTheme } from '@/components/ThemeContext'
import { I18nProvider } from '@/components/I18nContext'

// Routes that render without the app chrome (sidebar / header).
const BARE_ROUTES = ['/login']

function Chrome({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close drawer on navigation
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <BrandApplier />
      <div
        className={theme === 'glass' ? 'app-glass' : undefined}
        style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef1f4' }}
      >
        <Sidebar mobileOpen={menuOpen} />
        {menuOpen && <div className="app-sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header onMenuClick={() => setMenuOpen(o => !o)} />
          <main className="app-main" style={{ flex: 1, overflowY: 'auto', padding: '6px 28px 40px' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <ThemeProvider>
      <I18nProvider>
        <Chrome>{children}</Chrome>
      </I18nProvider>
    </ThemeProvider>
  )
}
