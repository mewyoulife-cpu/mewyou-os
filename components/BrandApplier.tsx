'use client'

import { useEffect } from 'react'

// Applies the saved branding (browser title + favicon) to the live document.
// Mounted once in the root layout so every page reflects Settings > Brand.
export function applyBrand(opts: { browserTitle?: string; favicon?: string | null }) {
  if (typeof document === 'undefined') return
  if (opts.browserTitle) document.title = opts.browserTitle
  if (opts.favicon) {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = opts.favicon
  }
}

export default function BrandApplier() {
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => applyBrand({ browserTitle: s?.browserTitle, favicon: s?.favicon }))
      .catch(() => {})
  }, [])
  return null
}
