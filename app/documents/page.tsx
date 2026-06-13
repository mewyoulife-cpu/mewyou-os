'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Document {
  id: string
  no: string
  type: 'quotation' | 'invoice' | 'receipt' | 'tax_invoice' | 'taxinvoice'
  status: string
  issueDate: string
  clientName?: string
  items: string
  discount: number
  vatEnabled: boolean
}

const typeConfig = {
  quotation:   { label: 'ใบเสนอราคา',   icon: 'request_quote', bg: '#ecebf8', color: '#6760a8' },
  invoice:     { label: 'Invoice',        icon: 'receipt_long',  bg: '#e9f3ed', color: '#3d8a64' },
  receipt:     { label: 'ใบเสร็จรับเงิน', icon: 'payments',      bg: '#fdf3e3', color: '#f4a431' },
  tax_invoice: { label: 'ใบกำกับภาษี',   icon: 'article',       bg: '#ecebf8', color: '#6760a8' },
  taxinvoice:  { label: 'ใบกำกับภาษี',   icon: 'article',       bg: '#ecebf8', color: '#6760a8' },
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label: 'ร่าง',        bg: '#f0f2f5', color: '#8a97a2' },
  sent:     { label: 'ส่งแล้ว',     bg: '#e8f1f9', color: '#6b96c2' },
  paid:     { label: 'ชำระแล้ว',    bg: '#e9f3ed', color: '#3d8a64' },
  overdue:  { label: 'เกินกำหนด',   bg: '#fceee8', color: '#e07b54' },
  approved: { label: 'อนุมัติแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
}

const TYPE_CHIPS = [
  { key: 'all',         label: 'ทั้งหมด' },
  { key: 'quotation',   label: 'ใบเสนอราคา' },
  { key: 'invoice',     label: 'Invoice' },
  { key: 'receipt',     label: 'ใบเสร็จรับเงิน' },
  { key: 'tax_invoice', label: 'ใบกำกับภาษี' },
]

function calcTotal(doc: Document): number {
  try {
    const items = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items
    const sub = items.reduce((s: number, i: { qty: number; price: number }) => s + i.qty * i.price, 0)
    const afterDiscount = sub - (doc.discount || 0)
    return doc.vatEnabled ? afterDiscount * 1.07 : afterDiscount
  } catch {
    return 0
  }
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChip, setActiveChip] = useState('all')

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(data => {
        setDocuments(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeChip === 'all'
    ? documents
    : documents.filter(d => d.type === activeChip || (activeChip === 'tax_invoice' && d.type === 'taxinvoice'))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>เอกสารทั้งหมด</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>ใบเสนอราคา · Invoice · ใบเสร็จ · ใบกำกับภาษี</div>
        </div>
        <Link href="/documents/new" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            height: 42, padding: '0 18px', borderRadius: 11,
            background: '#5f7d99', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(95,125,153,.3)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
            สร้างเอกสาร
          </div>
        </Link>
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {TYPE_CHIPS.map(chip => {
          const active = activeChip === chip.key
          return (
            <div
              key={chip.key}
              onClick={() => setActiveChip(chip.key)}
              style={{
                padding: '7px 15px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 600 : 500,
                background: active ? '#5f7d99' : '#fff',
                color: active ? '#fff' : '#7a8893',
                border: active ? '1px solid #5f7d99' : '1px solid #edf0f3',
                transition: 'all .15s',
              }}
            >
              {chip.label}
            </div>
          )
        })}
      </div>

      {/* Document table card */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: '18px 20px' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 1.1fr 0.9fr 0.9fr 1fr',
          gap: 8,
          fontSize: 12, color: '#9aa7b2', fontWeight: 500,
          padding: '0 4px 12px',
          borderBottom: '1px solid #f0f2f5',
        }}>
          <div>เอกสาร</div>
          <div>ลูกค้า</div>
          <div>วันที่</div>
          <div style={{ textAlign: 'right' }}>ยอดเงิน</div>
          <div style={{ textAlign: 'right' }}>สถานะ</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9aa7b2' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>hourglass_empty</span>
            กำลังโหลด...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 56, color: '#9aa7b2' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 44, display: 'block', marginBottom: 10, color: '#d0d8e0' }}>folder_open</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#7a8893', marginBottom: 4 }}>ยังไม่มีเอกสาร</div>
            <div style={{ fontSize: 13 }}>กดปุ่ม "สร้างเอกสาร" เพื่อเริ่มต้น</div>
          </div>
        ) : (
          filtered.map((doc) => {
            const tc = typeConfig[doc.type] || typeConfig.invoice
            const sc = statusConfig[doc.status] || statusConfig.draft
            const total = calcTotal(doc)
            return (
              <div
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 1.1fr 0.9fr 0.9fr 1fr',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 13.5,
                  padding: '12px 4px',
                  borderBottom: '1px solid #f4f6f8',
                  cursor: 'pointer',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#fafbfc'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                {/* Doc info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: tc.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: tc.color }}>{tc.icon}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 }}>{doc.no}</div>
                    <div style={{ fontSize: 12, color: '#9aa7b2' }}>{tc.label}</div>
                  </div>
                </div>

                {/* Customer */}
                <div style={{ fontWeight: 500, color: '#3b4954', fontSize: 13 }}>{doc.clientName || '—'}</div>

                {/* Date */}
                <div style={{ color: '#7a8893', fontSize: 13 }}>{doc.issueDate}</div>

                {/* Amount */}
                <div style={{ textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 }}>
                  ฿{fmt(total)}
                </div>

                {/* Status */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    background: sc.bg, color: sc.color,
                    borderRadius: 8, padding: '4px 10px',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {sc.label}
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
