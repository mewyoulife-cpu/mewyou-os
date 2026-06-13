'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Quotation {
  id: string
  no: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  issueDate: string
  expiry?: string
  clientName?: string
  discount: number
  vatEnabled: boolean
  items: string
  customer?: { name: string; company?: string }
}

const statusMap = {
  draft: { label: 'ร่าง', bg: '#f0f2f5', color: '#8a97a2' },
  sent: { label: 'ส่งแล้ว', bg: '#e8f1f9', color: '#6b96c2' },
  approved: { label: 'อนุมัติแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
  rejected: { label: 'ปฏิเสธ', bg: '#fceee8', color: '#e07b54' },
}

function calcTotal(q: Quotation): number {
  try {
    const items = typeof q.items === 'string' ? JSON.parse(q.items) : q.items
    const sub = items.reduce((s: number, i: { qty: number; price: number }) => s + (i.qty * i.price), 0)
    const afterDiscount = sub - (q.discount || 0)
    return q.vatEnabled ? afterDiscount * 1.07 : afterDiscount
  } catch {
    return 0
  }
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function QuotationListPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/quotations')
      .then(r => r.json())
      .then(data => {
        setQuotations(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const counts = {
    all: quotations.length,
    draft: quotations.filter(q => q.status === 'draft').length,
    sent: quotations.filter(q => q.status === 'sent').length,
    approved: quotations.filter(q => q.status === 'approved').length,
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบใบเสนอราคานี้?')) return
    await fetch(`/api/quotations/${id}`, { method: 'DELETE' })
    setQuotations(prev => prev.filter(q => q.id !== id))
    setDeleteId(null)
  }

  const summaryCards = [
    { label: 'ทั้งหมด', count: counts.all, icon: 'description', color: '#5f7d99', bg: '#e8eef4' },
    { label: 'ร่าง', count: counts.draft, icon: 'edit_note', color: '#8a97a2', bg: '#f0f2f5' },
    { label: 'ส่งแล้ว', count: counts.sent, icon: 'send', color: '#6b96c2', bg: '#e8f1f9' },
    { label: 'อนุมัติแล้ว', count: counts.approved, icon: 'check_circle', color: '#3d8a64', bg: '#e9f3ed' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>ใบเสนอราคา</h1>
          <p style={{ fontSize: 14, color: '#7a8893', margin: '4px 0 0' }}>{quotations.length} รายการ</p>
        </div>
        <Link href="/quotation/new" style={{ textDecoration: 'none' }}>
          <button style={{
            background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
            สร้างใบเสนอราคา
          </button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{
            background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: card.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 24, color: card.color }}>{card.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#2f3b45', lineHeight: 1 }}>{card.count}</div>
              <div style={{ fontSize: 13, color: '#7a8893', marginTop: 4 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60, fontSize: 15 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>hourglass_empty</span>
            กำลังโหลด...
          </div>
        ) : quotations.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: '#d0d8e0' }}>description</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#7a8893', marginBottom: 6 }}>ยังไม่มีใบเสนอราคา</div>
            <div style={{ fontSize: 14 }}>สร้างใบเสนอราคาใบแรกของคุณ</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                {['เลขที่', 'ลูกค้า', 'วันที่', 'วันหมดอายุ', 'มูลค่า', 'สถานะ', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '14px 18px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                    color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotations.map((q, idx) => {
                const st = statusMap[q.status] || statusMap.draft
                const total = calcTotal(q)
                return (
                  <tr
                    key={q.id}
                    style={{
                      borderBottom: idx < quotations.length - 1 ? '1px solid #f5f7f9' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9fafb'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    onClick={() => router.push(`/quotation/${q.id}`)}
                  >
                    <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>
                      {q.no}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 14, color: '#4a5a67' }}>
                      <div style={{ fontWeight: 500 }}>{q.clientName || q.customer?.name || '—'}</div>
                      {q.customer?.company && (
                        <div style={{ fontSize: 12, color: '#9aa7b2' }}>{q.customer.company}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: '#7a8893' }}>{q.issueDate}</td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: '#7a8893' }}>{q.expiry || '—'}</td>
                    <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>
                      ฿{fmt(total)}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        background: st.bg, color: st.color,
                        borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600,
                      }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => router.push(`/quotation/${q.id}`)}
                          title="ดู"
                          style={{
                            background: '#f0f2f5', color: '#5f7d99', border: 'none', borderRadius: 8,
                            width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>visibility</span>
                        </button>
                        <button
                          onClick={() => router.push(`/quotation/${q.id}?edit=1`)}
                          title="แก้ไข"
                          style={{
                            background: '#e8f1f9', color: '#6b96c2', border: 'none', borderRadius: 8,
                            width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          title="ลบ"
                          style={{
                            background: '#fceee8', color: '#e07b54', border: 'none', borderRadius: 8,
                            width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
