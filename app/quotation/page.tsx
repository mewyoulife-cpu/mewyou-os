'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Quotation {
  id: string
  no: string
  clientName: string
  projectName: string
  issueDate: string
  total: number
  status: 'draft' | 'sent' | 'approved' | 'rejected'
}

const statusMap = {
  draft:    { label: 'ร่าง',    bg: '#f5f7f9', color: '#7a8893' },
  sent:     { label: 'รอตอบ',   bg: '#fdf3e3', color: '#f4a431' },
  approved: { label: 'อนุมัติ', bg: '#e9f3ed', color: '#3d8a64' },
  rejected: { label: 'ยกเลิก',  bg: '#fceee8', color: '#c4593f' },
}

function fmtMoney(n: number) {
  return '฿' + Math.round(n).toLocaleString('th-TH')
}

export default function QuotationListPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

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
    all:      quotations.length,
    sent:     quotations.filter(q => q.status === 'sent').length,
    approved: quotations.filter(q => q.status === 'approved').length,
    rejected: quotations.filter(q => q.status === 'rejected').length,
  }

  const kpiCards = [
    { label: 'ทั้งหมด', value: counts.all,      accent: { width: 4, height: 40, borderRadius: 4, background: '#5f7d99' } },
    { label: 'รอตอบ',   value: counts.sent,     accent: { width: 4, height: 40, borderRadius: 4, background: '#f4a431' } },
    { label: 'อนุมัติ', value: counts.approved, accent: { width: 4, height: 40, borderRadius: 4, background: '#3d8a64' } },
    { label: 'ยกเลิก',  value: counts.rejected, accent: { width: 4, height: 40, borderRadius: 4, background: '#c4593f' } },
  ]

  const filterLabels: Record<string, string> = {
    all: 'สถานะ',
    draft: 'ร่าง',
    sent: 'รอตอบ',
    approved: 'อนุมัติ',
    rejected: 'ยกเลิก',
  }

  const filtered = quotations.filter(q => {
    const s = search.toLowerCase()
    const matchSearch = !s || q.no?.toLowerCase().includes(s) || q.clientName?.toLowerCase().includes(s) || q.projectName?.toLowerCase().includes(s)
    const matchStatus = filterStatus === 'all' || q.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div style={{ fontFamily: "'IBM Plex Sans Thai', 'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>ใบเสนอราคา</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>จัดการใบเสนอราคาทั้งหมดของสตูดิโอ</div>
        </div>
        <Link href="/quotation/new" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            height: 42, padding: '0 18px', borderRadius: 11,
            background: '#5f7d99', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(95,125,153,.3)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
            สร้างใบเสนอราคา
          </div>
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        {kpiCards.map(card => (
          <div key={card.label} style={{
            flex: '1 1 150px', minWidth: 140,
            background: '#fff', borderRadius: 14, border: '1px solid #edf0f3',
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13,
          }}>
            <div style={card.accent} />
            <div>
              <div style={{ fontSize: 12.5, color: '#7a8893' }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: '18px 20px' }}>

        {/* Search + Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{
            flex: 1, minWidth: 200,
            display: 'flex', alignItems: 'center', gap: 9,
            background: '#f5f7f9', border: '1px solid #eaedf0', borderRadius: 10,
            height: 40, padding: '0 14px',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9aa7b2' }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาเลขที่, ลูกค้า, โปรเจกต์..."
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                flex: 1, fontFamily: 'inherit', fontSize: 13.5, color: '#2f3b45',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setFilterOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 40, padding: '0 14px',
                border: '1px solid #eaedf0', borderRadius: 10,
                fontSize: 13.5, color: '#5b6b77', cursor: 'pointer', background: '#fff',
                userSelect: 'none',
              }}
            >
              {filterLabels[filterStatus] ?? 'สถานะ'}
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>expand_more</span>
            </div>
            {filterOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100,
                background: '#fff', borderRadius: 12, border: '1px solid #eaedf0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)', overflow: 'hidden', minWidth: 140,
              }}>
                {(['all', 'draft', 'sent', 'approved', 'rejected'] as const).map(s => (
                  <div
                    key={s}
                    onClick={() => { setFilterStatus(s); setFilterOpen(false) }}
                    style={{
                      padding: '10px 16px', fontSize: 13.5, color: filterStatus === s ? '#5f7d99' : '#2f3b45',
                      fontWeight: filterStatus === s ? 700 : 400, cursor: 'pointer',
                      background: filterStatus === s ? '#f0f5fa' : '#fff',
                    }}
                    onMouseEnter={e => { if (filterStatus !== s) (e.currentTarget as HTMLDivElement).style.background = '#f5f7f9' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = filterStatus === s ? '#f0f5fa' : '#fff' }}
                  >
                    {filterLabels[s]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1.1fr 1.3fr 0.9fr 0.9fr 1fr',
          gap: 8,
          fontSize: 12, color: '#9aa7b2', fontWeight: 500,
          padding: '0 4px 12px',
          borderBottom: '1px solid #f0f2f5',
        }}>
          <div>เลขที่</div>
          <div>ลูกค้า</div>
          <div>โปรเจกต์</div>
          <div>วันที่</div>
          <div style={{ textAlign: 'right' }}>ยอดเงิน</div>
          <div style={{ textAlign: 'right' }}>สถานะ</div>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#9aa7b2', gap: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 40 }}>hourglass_empty</span>
            <div style={{ fontSize: 14 }}>กำลังโหลด...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#9aa7b2', gap: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 48, color: '#d0d8e0' }}>request_quote</span>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#7a8893' }}>ยังไม่มีใบเสนอราคา</div>
            <div style={{ fontSize: 13 }}>สร้างใบเสนอราคาใบแรกของคุณ</div>
          </div>
        ) : (
          filtered.map(q => {
            const st = statusMap[q.status] ?? statusMap.draft
            return (
              <div
                key={q.id}
                onClick={() => router.push(`/quotation/${q.id}`)}
                onMouseEnter={() => setHoveredRow(q.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1.1fr 1.3fr 0.9fr 0.9fr 1fr',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 13.5,
                  padding: '14px 4px',
                  borderBottom: '1px solid #f4f6f8',
                  cursor: 'pointer',
                  background: hoveredRow === q.id ? '#fafbfc' : 'transparent',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{ fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }}>
                  {q.no}
                </div>
                <div style={{ fontWeight: 600, color: '#2f3b45', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.clientName || '—'}
                </div>
                <div style={{ color: '#7a8893', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.projectName || '—'}
                </div>
                <div style={{ color: '#7a8893', fontSize: 13 }}>
                  {q.issueDate || '—'}
                </div>
                <div style={{ textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {fmtMoney(q.total ?? 0)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block',
                    background: st.bg, color: st.color,
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {st.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
