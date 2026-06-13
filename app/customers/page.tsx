'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  company?: string
  type: 'vip' | 'new' | 'normal'
  phone?: string
  email?: string
  _count?: { projects: number }
}

const typeMap = {
  vip:    { label: 'VIP',     bg: '#fdf3e3', color: '#f4a431' },
  new:    { label: 'ลูกค้าใหม่', bg: '#e9f3ed', color: '#3d8a64' },
  normal: { label: 'ปกติ',   bg: '#e8eef4', color: '#5f7d99' },
}

const avatarGradients = [
  'linear-gradient(135deg,#eef2f6,#dde6ee)',
  'linear-gradient(135deg,#e9f3ed,#cde5d8)',
  'linear-gradient(135deg,#fdf3e3,#fae2b8)',
  'linear-gradient(135deg,#f0eef8,#dddaee)',
  'linear-gradient(135deg,#fceee8,#f8d4c9)',
]

function getGradient(name: string) {
  return avatarGradients[name.charCodeAt(0) % avatarGradients.length]
}

function getInitial(name: string) {
  return name.slice(0, 1).toUpperCase()
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => {
        setCustomers(Array.isArray(data) ? data : data.customers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>ลูกค้าทั้งหมด</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>
            {loading ? 'กำลังโหลด...' : `${customers.length} ราย · VIP ${customers.filter(c => c.type === 'vip').length} ราย · ลูกค้าใหม่ ${customers.filter(c => c.type === 'new').length} ราย`}
          </div>
        </div>
        <Link href="/customers/new" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 42, padding: '0 18px', borderRadius: 11, background: '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>person_add</span>
            เพิ่มลูกค้า
          </div>
        </Link>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#ffffff', border: '1px solid #e4e8ec', borderRadius: 12, height: 44, padding: '0 16px', marginBottom: 18, maxWidth: 440 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>search</span>
        <input
          type="text"
          placeholder="ค้นหาชื่อลูกค้า, บริษัท, เบอร์โทร..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'inherit', fontSize: 14, color: '#2f3b45' }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60, fontSize: 15 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>hourglass_empty</span>
          กำลังโหลด...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60, fontSize: 15 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>person_off</span>
          ไม่พบลูกค้า
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {filtered.map(customer => {
            const type = typeMap[customer.type] || typeMap.normal
            const projectCount = customer._count?.projects ?? 0
            return (
              <div
                key={customer.id}
                onClick={() => router.push(`/customers/${customer.id}`)}
                style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #edf0f3', padding: 18, cursor: 'pointer', transition: 'box-shadow .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 22px rgba(40,60,80,.10)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                {/* Avatar + name + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#54697d', fontSize: 17, background: getGradient(customer.name), fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    {getInitial(customer.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: '#2f3b45', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#9aa7b2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {customer.company || '—'}
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, background: type.bg, color: type.color, flexShrink: 0 }}>
                    {type.label}
                  </span>
                </div>

                {/* Logo placeholder */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 13, height: 40, border: '1.5px dashed #d4dce2', borderRadius: 10, cursor: 'pointer', background: '#fafbfc' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#bcc7d1' }}>add_photo_alternate</span>
                  <span style={{ fontSize: 12, color: '#9aa7b2' }}>เพิ่มโลโก้แบรนด์</span>
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#7a8893', marginTop: 14 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#a9b6c0' }}>call</span>
                  {customer.phone || '—'}
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f2f4f6' }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: '#9aa7b2' }}>โปรเจกต์</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#3b4954', fontFamily: "'IBM Plex Sans', sans-serif" }}>{projectCount}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11.5, color: '#9aa7b2' }}>ยอดซื้อรวม</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿0</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
