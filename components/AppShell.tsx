'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import BrandApplier from '@/components/BrandApplier'
import { ThemeProvider, useTheme } from '@/components/ThemeContext'

// Routes that render without the app chrome (sidebar / header).
const BARE_ROUTES = ['/login']

function Chrome({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <>
      <BrandApplier />
      <div
        className={theme === 'glass' ? 'app-glass' : undefined}
        style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef1f4' }}
      >
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header />
          <main style={{ flex: 1, overflowY: 'auto', padding: '6px 28px 40px' }}>
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
      <Chrome>{children}</Chrome>
    </ThemeProvider>
  )
}
