'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header style={{
      height: 72,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '0 28px',
      background: '#eef1f4',
    }}>
      {/* Search */}
      <div style={{
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
          placeholder="ค้นหาโปรเจกต์, ลูกค้า, เลขที่เอกสาร..."
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
          สร้างใหม่
        </div>
      </Link>
    </header>
  )
}
