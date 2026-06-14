'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import BrandApplier from '@/components/BrandApplier'

// Routes that render without the app chrome (sidebar / header).
const BARE_ROUTES = ['/login']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <>
      <BrandApplier />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef1f4' }}>
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
