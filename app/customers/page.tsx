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
  projects?: number
  logo?: string
}

const typeMap = {
  vip: { label: 'VIP', bg: '#fdf3e3', color: '#f4a431' },
  new: { label: 'ใหม่', bg: '#e9f3ed', color: '#3d8a64' },
  normal: { label: 'ปกติ', bg: '#e8eef4', color: '#5f7d99' },
}

const gradients = [
  'linear-gradient(135deg, #5f7d99, #3d5a73)',
  'linear-gradient(135deg, #3d8a64, #2a6347)',
  'linear-gradient(135deg, #f4a431, #d4841a)',
  'linear-gradient(135deg, #7c6fab, #5c4f8b)',
  'linear-gradient(135deg, #c4593f, #a03a25)',
]

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function getGradient(name: string) {
  const idx = name.charCodeAt(0) % gradients.length
  return gradients[idx]
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
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>ลูกค้าทั้งหมด</h1>
          <p style={{ fontSize: 14, color: '#7a8893', margin: '4px 0 0' }}>
            ลูกค้า {customers.length} ราย
          </p>
        </div>
        <Link href="/customers/new" style={{ textDecoration: 'none' }}>
          <button style={{
            background: '#5f7d99',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
            เพิ่มลูกค้า
          </button>
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span className="material-symbols-rounded" style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 20, color: '#9aa7b2',
        }}>search</span>
        <input
          type="text"
          placeholder="ค้นหาลูกค้า..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 14px 11px 42px',
            border: '1px solid #edf0f3',
            borderRadius: 12,
            fontSize: 14,
            color: '#2f3b45',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
          }}
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(customer => {
            const type = typeMap[customer.type] || typeMap.normal
            return (
              <div
                key={customer.id}
                onClick={() => router.push(`/customers/${customer.id}`)}
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  border: '1px solid #edf0f3',
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Top row: avatar + name + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: getGradient(customer.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
                  }}>
                    {getInitials(customer.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#2f3b45', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {customer.name}
                      </span>
                      <span style={{
                        background: type.bg, color: type.color,
                        borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {type.label}
                      </span>
                    </div>
                    {customer.company && (
                      <div style={{ fontSize: 12, color: '#7a8893', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customer.company}
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo placeholder */}
                <div style={{
                  height: 54,
                  border: '1.5px dashed #d0d8e0',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9aa7b2',
                  fontSize: 12,
                  marginBottom: 12,
                  background: '#f9fafb',
                }}>
                  {customer.logo ? (
                    <img src={customer.logo} alt="logo" style={{ maxHeight: 44, maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#b0bdc8' }}>image</span>
                      <span style={{ color: '#b0bdc8' }}>โลโก้</span>
                    </div>
                  )}
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {customer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7a8893' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>call</span>
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7a8893' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>mail</span>
                      {customer.email}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7a8893' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>folder</span>
                    {customer.projects ?? 0} โปรเจกต์
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
