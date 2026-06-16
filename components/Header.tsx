'use client'

import Link from 'next/link'
import { useTheme } from './ThemeContext'
import { useI18n } from './I18nContext'

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, toggle } = useTheme()
  const { lang, setLang, t } = useI18n()
  const glass = theme === 'glass'
  return (
    <header style={{
      height: 72,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '0 18px',
      background: '#eef1f4',
    }}>
      {/* Hamburger (mobile only) */}
      <div
        onClick={onMenuClick}
        className="app-hamburger"
        style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          alignItems: 'center', justifyContent: 'center',
          background: '#ffffff', border: '1px solid #e4e8ec', cursor: 'pointer',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#5b6b77' }}>menu</span>
      </div>

      {/* Search */}
      <div className="header-search" style={{
        flex: 1,
        maxWidth: 540,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#ffffff',
        border: '1px solid #e4e8ec',
        borderRadius: 12,
        padding: '0 16px',
        height: 44,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 21, color: '#9aa7b2' }}>search</span>
        <input
          placeholder={t('ค้นหาโปรเจกต์, ลูกค้า, เลขที่เอกสาร...')}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            flex: 1,
            fontFamily: 'inherit',
            fontSize: 14,
            color: '#2f3b45',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Theme toggle (normal ↔ glassmorphism) */}
      <div
        onClick={toggle}
        title={glass ? t('โหมดปกติ') : t('โหมด Glassmorphism')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          height: 44,
          padding: '0 14px',
          borderRadius: 12,
          background: glass ? 'rgba(255,255,255,0.55)' : '#ffffff',
          border: glass ? '1px solid rgba(255,255,255,0.7)' : '1px solid #e4e8ec',
          WebkitBackdropFilter: glass ? 'blur(12px)' : undefined,
          backdropFilter: glass ? 'blur(12px)' : undefined,
          cursor: 'pointer',
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 600,
          color: glass ? '#3d6e8e' : '#5b6b77',
          whiteSpace: 'nowrap',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 20, color: glass ? '#3d6e8e' : '#9aa7b2' }}>
          {glass ? 'blur_on' : 'blur_off'}
        </span>
        <span className="hide-mobile">{glass ? 'Glass' : (lang === 'en' ? 'Normal' : 'ปกติ')}</span>
      </div>

      {/* Language toggle (TH / ENG) — top-right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
        flexShrink: 0,
        border: glass ? '1px solid rgba(255,255,255,0.7)' : '1px solid #e4e8ec',
        background: glass ? 'rgba(255,255,255,0.55)' : '#ffffff',
        WebkitBackdropFilter: glass ? 'blur(12px)' : undefined,
        backdropFilter: glass ? 'blur(12px)' : undefined,
      }}>
        {(['th', 'en'] as const).map(l => {
          const active = lang === l
          return (
            <div
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '0 13px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                background: active ? '#5f7d99' : 'transparent',
                color: active ? '#ffffff' : (glass ? '#3d6e8e' : '#8a97a2'),
              }}
            >
              {l === 'th' ? 'TH' : 'ENG'}
            </div>
          )
        })}
      </div>

      {/* Notification Bell */}
      <div style={{
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: 12,
        background: '#ffffff',
        border: '1px solid #e4e8ec',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#5b6b77' }}>notifications</span>
        <div style={{
          position: 'absolute',
          top: 8,
          right: 9,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#d96a5b',
          color: '#fff',
          fontSize: 10,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #eef1f4',
        }}>5</div>
      </div>

      {/* Create Button */}
      <Link href="/projects/new" style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          height: 44,
          padding: '0 18px',
          borderRadius: 12,
          background: '#5f7d99',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(95,125,153,.3)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
          <span className="hide-mobile">{t('สร้างใหม่')}</span>
        </div>
      </Link>
    </header>
  )
}
