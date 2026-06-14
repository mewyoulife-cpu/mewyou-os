'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type TypeKey = 'quotation' | 'invoice' | 'receipt' | 'tax_invoice'

interface RawItem { qty: number; price: number }

interface RawDoc {
  id: string
  no: string
  type?: string
  status: string
  issueDate: string
  clientName?: string
  items: string | RawItem[]
  discount?: number
  vatEnabled?: boolean
  customer?: { name?: string; company?: string } | null
}

interface Row {
  id: string
  no: string
  typeKey: TypeKey
  customerName: string
  date: string
  amount: number
  status: string
  href: string
}

const typeConfig: Record<TypeKey, { label: string; icon: string; bg: string; color: string }> = {
  quotation:   { label: 'ใบเสนอราคา',   icon: 'request_quote', bg: '#ecebf8', color: '#6760a8' },
  invoice:     { label: 'Invoice',        icon: 'receipt_long',  bg: '#e9f3ed', color: '#3d8a64' },
  receipt:     { label: 'ใบเสร็จรับเงิน', icon: 'payments',      bg: '#fdf3e3', color: '#f4a431' },
  tax_invoice: { label: 'ใบกำกับภาษี',   icon: 'article',       bg: '#ecebf8', color: '#6760a8' },
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label: 'ร่าง',        bg: '#f0f2f5', color: '#8a97a2' },
  sent:     { label: 'ส่งแล้ว',     bg: '#e8f1f9', color: '#6b96c2' },
  paid:     { label: 'ชำระแล้ว',    bg: '#e9f3ed', color: '#3d8a64' },
  overdue:  { label: 'เกินกำหนด',   bg: '#fceee8', color: '#e07b54' },
  approved: { label: 'อนุมัติแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
  rejected: { label: 'ปฏิเสธ',      bg: '#fceee8', color: '#e07b54' },
}

const TYPE_CHIPS: { key: 'all' | TypeKey; label: string }[] = [
  { key: 'all',         label: 'ทั้งหมด' },
  { key: 'quotation',   label: 'ใบเสนอราคา' },
  { key: 'invoice',     label: 'Invoice' },
  { key: 'receipt',     label: 'ใบเสร็จรับเงิน' },
  { key: 'tax_invoice', label: 'ใบกำกับภาษี' },
]

function calcAmount(doc: RawDoc): number {
  try {
    const items = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items
    const sub = (items as RawItem[]).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0)
    const afterDiscount = sub - (doc.discount || 0)
    return doc.vatEnabled ? afterDiscount * 1.07 : afterDiscount
  } catch {
    return 0
  }
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function normalizeDocType(t?: string): TypeKey {
  if (t === 'taxinvoice' || t === 'tax_invoice') return 'tax_invoice'
  if (t === 'receipt') return 'receipt'
  return 'invoice'
}

function custName(d: RawDoc): string {
  return d.clientName || d.customer?.company || d.customer?.name || '—'
}

export default function DocumentsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'tracking'>('all')
  const [activeChip, setActiveChip] = useState<'all' | TypeKey>('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/quotations').then(r => r.json()).catch(() => []),
      fetch('/api/documents').then(r => r.json()).catch(() => []),
    ]).then(([quotations, documents]) => {
      const qRows: Row[] = (Array.isArray(quotations) ? quotations : []).map((q: RawDoc) => ({
        id: q.id,
        no: q.no,
        typeKey: 'quotation' as TypeKey,
        customerName: custName(q),
        date: q.issueDate,
        amount: calcAmount(q),
        status: q.status,
        href: `/quotation/${q.id}`,
      }))
      const dRows: Row[] = (Array.isArray(documents) ? documents : []).map((d: RawDoc) => ({
        id: d.id,
        no: d.no,
        typeKey: normalizeDocType(d.type),
        customerName: custName(d),
        date: d.issueDate,
        amount: calcAmount(d),
        status: d.status,
        href: `/documents/${d.id}`,
      }))
      setRows([...qRows, ...dRows])
      setLoading(false)
    })
  }, [])

  const filtered = activeChip === 'all' ? rows : rows.filter(r => r.typeKey === activeChip)
  const taxRows = rows.filter(r => r.typeKey === 'tax_invoice')
  const txDelivered = taxRows.filter(r => r.status === 'sent' || r.status === 'paid').length
  const txPending = taxRows.length - txDelivered

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>เอกสารทั้งหมด</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>ใบเสนอราคา · Invoice · ใบเสร็จ · ใบกำกับภาษี</div>
        </div>
        <Link href="/documents/new" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 42, padding: '0 18px', borderRadius: 11, background: '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
            สร้างเอกสาร
          </div>
        </Link>
      </div>

      {/* Top tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <div
          onClick={() => setTab('all')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 11, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: tab === 'all' ? '#5f7d99' : '#fff', color: tab === 'all' ? '#fff' : '#5b6b77', border: tab === 'all' ? '1px solid #5f7d99' : '1px solid #edf0f3' }}
        >
          เอกสารทั้งหมด
        </div>
        <div
          onClick={() => setTab('tracking')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 11, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: tab === 'tracking' ? '#5f7d99' : '#fff', color: tab === 'tracking' ? '#fff' : '#5b6b77', border: tab === 'tracking' ? '1px solid #5f7d99' : '1px solid #edf0f3' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>local_shipping</span>
          ติดตามการส่งใบกำกับภาษี
        </div>
      </div>

      {tab === 'all' ? (
        <>
          {/* Type filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {TYPE_CHIPS.map(chip => {
              const active = activeChip === chip.key
              const count = chip.key === 'all' ? rows.length : rows.filter(r => r.typeKey === chip.key).length
              return (
                <div
                  key={chip.key}
                  onClick={() => setActiveChip(chip.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 15px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 500, background: active ? '#5f7d99' : '#fff', color: active ? '#fff' : '#7a8893', border: active ? '1px solid #5f7d99' : '1px solid #edf0f3', transition: 'all .15s' }}
                >
                  {chip.label}
                  <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", padding: '1px 7px', borderRadius: 7, background: active ? 'rgba(255,255,255,.22)' : '#f0f2f5', color: active ? '#fff' : '#9aa7b2' }}>{count}</span>
                </div>
              )
            })}
          </div>

          {/* Document table card */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: '18px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.1fr 0.9fr 0.9fr 1fr', gap: 8, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 12px', borderBottom: '1px solid #f0f2f5' }}>
              <div>เอกสาร</div>
              <div>ลูกค้า</div>
              <div>วันที่</div>
              <div style={{ textAlign: 'right' }}>ยอดเงิน</div>
              <div style={{ textAlign: 'right' }}>สถานะ</div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#9aa7b2' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>hourglass_empty</span>
                กำลังโหลด...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 56, color: '#9aa7b2' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 44, display: 'block', marginBottom: 10, color: '#d0d8e0' }}>folder_open</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#7a8893', marginBottom: 4 }}>ยังไม่มีเอกสาร</div>
                <div style={{ fontSize: 13 }}>กดปุ่ม &quot;สร้างเอกสาร&quot; เพื่อเริ่มต้น</div>
              </div>
            ) : (
              filtered.map(row => {
                const tc = typeConfig[row.typeKey]
                const sc = statusConfig[row.status] || statusConfig.draft
                return (
                  <div
                    key={row.typeKey + row.id}
                    onClick={() => router.push(row.href)}
                    style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.1fr 0.9fr 0.9fr 1fr', gap: 8, alignItems: 'center', fontSize: 13.5, padding: '12px 4px', borderBottom: '1px solid #f4f6f8', cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#fafbfc'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 20, color: tc.color }}>{tc.icon}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 }}>{row.no}</div>
                        <div style={{ fontSize: 12, color: '#9aa7b2' }}>{tc.label}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 500, color: '#3b4954', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.customerName}</div>
                    <div style={{ color: '#7a8893', fontSize: 13 }}>{row.date}</div>
                    <div style={{ textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 }}>฿{fmt(row.amount)}</div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{sc.label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      ) : (
        /* Tracking tab */
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ flex: '1 1 160px', background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '16px 18px' }}>
              <div style={{ fontSize: 12.5, color: '#7a8893' }}>ใบกำกับภาษีทั้งหมด</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{taxRows.length}</div>
            </div>
            <div style={{ flex: '1 1 160px', background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '16px 18px' }}>
              <div style={{ fontSize: 12.5, color: '#3d8a64' }}>ส่งครบแล้ว</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#3d8a64', fontFamily: "'IBM Plex Sans', sans-serif" }}>{txDelivered}</div>
            </div>
            <div style={{ flex: '1 1 160px', background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '16px 18px' }}>
              <div style={{ fontSize: 12.5, color: '#c4593f' }}>ยังไม่ส่ง / ค้าง</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#c4593f', fontFamily: "'IBM Plex Sans', sans-serif" }}>{txPending}</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 21, color: '#5f7d99' }}>local_shipping</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>สถานะการส่งใบกำกับภาษี</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr 1fr 1.3fr 1fr', gap: 10, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 11px', borderBottom: '1px solid #f0f2f5' }}>
              <div>เลขที่ / ลูกค้า</div>
              <div>วันที่</div>
              <div style={{ textAlign: 'right' }}>ยอดเงิน</div>
              <div>การส่ง</div>
              <div style={{ textAlign: 'right' }}>สถานะ</div>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa7b2' }}>กำลังโหลด...</div>
            ) : taxRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#9aa7b2' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8, color: '#d0d8e0' }}>local_shipping</span>
                ยังไม่มีใบกำกับภาษี
              </div>
            ) : (
              taxRows.map(row => {
                const delivered = row.status === 'sent' || row.status === 'paid'
                const sc = statusConfig[row.status] || statusConfig.draft
                return (
                  <div
                    key={row.id}
                    onClick={() => router.push(row.href)}
                    style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr 1fr 1.3fr 1fr', gap: 10, alignItems: 'center', fontSize: 13, padding: '13px 4px', borderBottom: '1px solid #f4f6f8', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#fafbfc'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }}>{row.no}</div>
                      <div style={{ fontSize: 12, color: '#9aa7b2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.customerName}</div>
                    </div>
                    <div style={{ color: '#7a8893' }}>{row.date}</div>
                    <div style={{ textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{fmt(row.amount)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: delivered ? '#3d8a64' : '#a9762f', fontSize: 12.5 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 17 }}>{delivered ? 'mark_email_read' : 'schedule_send'}</span>
                      {delivered ? 'ส่งแล้ว' : 'รอจัดส่ง'}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{sc.label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
