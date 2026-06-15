'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'normal' | 'glass'

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'normal',
  toggle: () => {},
})

export function useTheme() {
  return useContext(ThemeCtx)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('normal')

  // Restore the saved preference once on mount.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from persisted storage
      if (localStorage.getItem('mewyou_theme') === 'glass') setTheme('glass')
    } catch { /* ignore */ }
  }, [])

  const toggle = () =>
    setTheme(t => {
      const next: Theme = t === 'glass' ? 'normal' : 'glass'
      try { localStorage.setItem('mewyou_theme', next) } catch { /* ignore */ }
      return next
    })

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}
