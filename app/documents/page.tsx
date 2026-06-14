'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  // tax-invoice delivery tracking
  txEmailSent?: boolean
  txPostSent?: boolean
  txCarrier?: string | null
  txTracking?: string | null
  txSlipUrl?: string | null
  txSentBy?: string | null
  txSentAt?: string | null
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

const CARRIERS = ['ไปรษณีย์ไทย', 'Kerry', 'Flash', 'J&T', 'อื่นๆ']

const DOC_TYPE_CARDS = [
  { label: 'ใบเสนอราคา', desc: 'เสนอราคางานออกแบบให้ลูกค้า', icon: 'request_quote', bg: '#ecebf8', color: '#6760a8', href: '/quotation/new' },
  { label: 'Invoice',     desc: 'แจ้งยอดที่ต้องชำระ',         icon: 'receipt_long',  bg: '#fdf3e3', color: '#f4a431', href: '/documents/new?type=invoice' },
  { label: 'ใบเสร็จ',     desc: 'ยืนยันการรับชำระเงิน',       icon: 'receipt',       bg: '#e9f3ed', color: '#3d8a64', href: '/documents/new?type=receipt' },
  { label: 'ใบกำกับภาษี', desc: 'เอกสารภาษีมูลค่าเพิ่ม',      icon: 'article',       bg: '#ecebf8', color: '#6760a8', href: '/documents/new?type=taxinvoice' },
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

function isDelivered(d: RawDoc): boolean {
  return !!(d.txEmailSent || d.txPostSent)
}

// Compress an image file to a small JPEG data URL suitable for storing in the DB
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const maxW = 700
        const scale = Math.min(1, maxW / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function DocumentsPage() {
  const router = useRouter()
  const [quotationRows, setQuotationRows] = useState<Row[]>([])
  const [rawDocs, setRawDocs] = useState<RawDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'tracking'>('all')
  const [activeChip, setActiveChip] = useState<'all' | TypeKey>('all')
  const [trackId, setTrackId] = useState<string | null>(null)
  const [chooserOpen, setChooserOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/quotations').then(r => r.json()).catch(() => []),
      fetch('/api/documents').then(r => r.json()).catch(() => []),
    ]).then(([quotations, documents]) => {
      setQuotationRows((Array.isArray(quotations) ? quotations : []).map((q: RawDoc) => ({
        id: q.id,
        no: q.no,
        typeKey: 'quotation' as TypeKey,
        customerName: custName(q),
        date: q.issueDate,
        amount: calcAmount(q),
        status: q.status,
        href: `/quotation/${q.id}`,
      })))
      setRawDocs(Array.isArray(documents) ? documents : [])
      setLoading(false)
    })
  }, [])

  const docRows: Row[] = rawDocs.map(d => ({
    id: d.id,
    no: d.no,
    typeKey: normalizeDocType(d.type),
    customerName: custName(d),
    date: d.issueDate,
    amount: calcAmount(d),
    status: d.status,
    href: `/documents/${d.id}`,
  }))
  const rows: Row[] = [...quotationRows, ...docRows]

  const filtered = activeChip === 'all' ? rows : rows.filter(r => r.typeKey === activeChip)
  const taxDocs = rawDocs.filter(d => normalizeDocType(d.type) === 'tax_invoice')
  const txDelivered = taxDocs.filter(isDelivered).length
  const txPending = taxDocs.length - txDelivered

  function handleSavedTracking(updated: RawDoc) {
    setRawDocs(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d))
    setTrackId(null)
  }

  const trackingDoc = rawDocs.find(d => d.id === trackId) || null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>เอกสารทั้งหมด</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>ใบเสนอราคา · Invoice · ใบเสร็จ · ใบกำกับภาษี</div>
        </div>
        <div onClick={() => setChooserOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 42, padding: '0 18px', borderRadius: 11, background: '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
          สร้างเอกสาร
        </div>
      </div>

      {/* Top tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <div onClick={() => setTab('all')} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 11, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: tab === 'all' ? '#5f7d99' : '#fff', color: tab === 'all' ? '#fff' : '#5b6b77', border: tab === 'all' ? '1px solid #5f7d99' : '1px solid #edf0f3' }}>
          เอกสารทั้งหมด
        </div>
        <div onClick={() => setTab('tracking')} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 11, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, background: tab === 'tracking' ? '#5f7d99' : '#fff', color: tab === 'tracking' ? '#fff' : '#5b6b77', border: tab === 'tracking' ? '1px solid #5f7d99' : '1px solid #edf0f3' }}>
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
                <div key={chip.key} onClick={() => setActiveChip(chip.key)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 15px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 500, background: active ? '#5f7d99' : '#fff', color: active ? '#fff' : '#7a8893', border: active ? '1px solid #5f7d99' : '1px solid #edf0f3', transition: 'all .15s' }}>
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
                  <div key={row.typeKey + row.id} onClick={() => router.push(row.href)} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.1fr 0.9fr 0.9fr 1fr', gap: 8, alignItems: 'center', fontSize: 13.5, padding: '12px 4px', borderBottom: '1px solid #f4f6f8', cursor: 'pointer', transition: 'background .1s' }}
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
              <div style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{taxDocs.length}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1.4fr 1fr', gap: 10, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 11px', borderBottom: '1px solid #f0f2f5' }}>
              <div>เลขที่ / ลูกค้า</div>
              <div>อีเมล</div>
              <div>ไปรษณีย์/ขนส่ง</div>
              <div>เลข Tracking</div>
              <div style={{ textAlign: 'right' }}>สถานะ</div>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa7b2' }}>กำลังโหลด...</div>
            ) : taxDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#9aa7b2' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8, color: '#d0d8e0' }}>local_shipping</span>
                ยังไม่มีใบกำกับภาษี
              </div>
            ) : (
              taxDocs.map(d => {
                const delivered = isDelivered(d)
                return (
                  <div key={d.id} onClick={() => setTrackId(d.id)} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1.4fr 1fr', gap: 10, alignItems: 'center', fontSize: 13, padding: '13px 4px', borderBottom: '1px solid #f4f6f8', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#fafbfc'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }}>{d.no}</div>
                      <div style={{ fontSize: 12, color: '#9aa7b2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{custName(d)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: d.txEmailSent ? '#3d8a64' : '#c3cdd6' }}>{d.txEmailSent ? 'mark_email_read' : 'mail'}</span>
                      <span style={{ fontSize: 11.5, color: '#8a97a2' }}>{d.txEmailSent ? 'ส่งแล้ว' : '—'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#5b6b77' }}>{d.txPostSent ? (d.txCarrier || 'ส่งแล้ว') : '—'}</div>
                    <div style={{ fontSize: 12, color: '#5b6b77', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {d.txTracking ? <span style={{ background: '#eef3f7', padding: '3px 8px', borderRadius: 6 }}>{d.txTracking}</span> : '—'}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: delivered ? '#e9f3ed' : '#fbeee4', color: delivered ? '#3d8a64' : '#a9762f', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{delivered ? 'ส่งแล้ว' : 'ค้างส่ง'}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {trackingDoc && (
        <TrackingModal
          doc={trackingDoc}
          onClose={() => setTrackId(null)}
          onSaved={handleSavedTracking}
        />
      )}

      {chooserOpen && (
        <div onClick={() => setChooserOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.32)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(30,45,60,.28)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f2f5' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#2f3b45' }}>สร้างเอกสารใหม่</div>
                <div style={{ fontSize: 12.5, color: '#9aa7b2', marginTop: 2 }}>เลือกประเภทเอกสารที่ต้องการสร้าง</div>
              </div>
              <div onClick={() => setChooserOpen(false)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>close</span>
              </div>
            </div>
            <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {DOC_TYPE_CARDS.map(card => (
                <div
                  key={card.label}
                  onClick={() => { setChooserOpen(false); router.push(card.href) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, border: '1px solid #edf0f3', borderRadius: 14, cursor: 'pointer', transition: 'all .15s', background: '#fff' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#bcd0df'; el.style.boxShadow = '0 6px 16px rgba(40,60,80,.08)'; el.style.background = '#fbfdfe' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#edf0f3'; el.style.boxShadow = 'none'; el.style.background = '#fff' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 24, color: card.color }}>{card.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>{card.label}</div>
                    <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 1 }}>{card.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TrackingModal({ doc, onClose, onSaved }: { doc: RawDoc; onClose: () => void; onSaved: (d: RawDoc) => void }) {
  const [emailSent, setEmailSent] = useState(!!doc.txEmailSent)
  const [postSent, setPostSent] = useState(!!doc.txPostSent)
  const [carrier, setCarrier] = useState(doc.txCarrier || '')
  const [tracking, setTracking] = useState(doc.txTracking || '')
  const [slip, setSlip] = useState<string | null>(doc.txSlipUrl || null)
  const [by, setBy] = useState(doc.txSentBy || 'Mew')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleSlip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      setSlip(await fileToCompressedDataUrl(file))
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txEmailSent: emailSent,
          txPostSent: postSent,
          txCarrier: postSent ? (carrier || null) : null,
          txTracking: postSent ? (tracking || null) : null,
          txSlipUrl: postSent ? slip : null,
          txSentBy: by || null,
          txSentAt: new Date().toISOString(),
        }),
      })
      const updated = await res.json()
      onSaved(updated)
    } finally {
      setSaving(false)
    }
  }

  const toggleStyle = (on: boolean): React.CSSProperties => ({
    width: 44, height: 26, borderRadius: 13, background: on ? '#5f7d99' : '#d4dce2', position: 'relative', cursor: 'pointer', transition: 'background .15s', flexShrink: 0,
  })
  const knobStyle = (on: boolean): React.CSSProperties => ({
    position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
  })

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.32)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(30,45,60,.28)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f0f2f5', position: 'sticky', top: 0, background: '#fff', borderRadius: '18px 18px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#5f7d99' }}>local_shipping</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>บันทึกการส่งใบกำกับภาษี</div>
              <div style={{ fontSize: 12, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{doc.no} · {custName(doc)}</div>
            </div>
          </div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>close</span>
          </div>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, border: '1px solid #f0f2f5', borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#5f7d99' }}>mail</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>ส่งทางอีเมล</div>
                <div style={{ fontSize: 12, color: '#9aa7b2' }}>แนบไฟล์ PDF ส่งให้ลูกค้า</div>
              </div>
            </div>
            <div onClick={() => setEmailSent(v => !v)} style={toggleStyle(emailSent)}><div style={knobStyle(emailSent)} /></div>
          </div>

          {/* Post */}
          <div style={{ padding: 14, border: '1px solid #f0f2f5', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#5f7d99' }}>local_shipping</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>ส่งไปรษณีย์ / ขนส่ง</div>
                  <div style={{ fontSize: 12, color: '#9aa7b2' }}>ส่งตัวจริงทางขนส่ง</div>
                </div>
              </div>
              <div onClick={() => setPostSent(v => !v)} style={toggleStyle(postSent)}><div style={knobStyle(postSent)} /></div>
            </div>

            {postSent && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f2f5' }}>
                <div style={{ fontSize: 12.5, color: '#7a8893', marginBottom: 8 }}>เลือกขนส่ง</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 13 }}>
                  {CARRIERS.map(c => {
                    const active = carrier === c
                    return (
                      <div key={c} onClick={() => setCarrier(c)} style={{ padding: '6px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: active ? 600 : 500, border: active ? '1.5px solid #5f7d99' : '1.5px solid #e4e8ec', background: active ? '#e8eef4' : '#fff', color: active ? '#5f7d99' : '#7a8893' }}>{c}</div>
                    )
                  })}
                </div>
                <div style={{ fontSize: 12.5, color: '#7a8893', marginBottom: 6 }}>เลข Tracking</div>
                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="เช่น KEX1122334455" style={{ width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 40, padding: '0 13px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13.5, color: '#2f3b45', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
                <div style={{ fontSize: 12.5, color: '#7a8893', margin: '13px 0 8px' }}>สลิป / ใบจัดส่งขนส่ง</div>
                {slip ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 11, border: '1px solid #d6e7dd', borderRadius: 11, background: '#f7faf8' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slip} alt="slip" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3d8a64', fontWeight: 600 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 17 }}>check_circle</span>แนบสลิปจัดส่งแล้ว
                    </div>
                    <div onClick={() => setSlip(null)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#c3cdd6' }}>delete</span>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 13, border: '1.5px dashed #c9d7cf', borderRadius: 11, cursor: 'pointer', background: '#f7faf8' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 23, color: '#5f9b78' }}>{uploading ? 'hourglass_empty' : 'add_photo_alternate'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#3d6a52' }}>{uploading ? 'กำลังอัปโหลด...' : 'แนบรูปสลิปจัดส่ง'}</div>
                      <div style={{ fontSize: 11.5, color: '#8aa698' }}>รูปใบเสร็จขนส่ง / หลักฐานการส่ง · JPG, PNG</div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleSlip} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, color: '#7a8893', marginBottom: 6 }}>ผู้ดำเนินการ</div>
            <input value={by} onChange={e => setBy(e.target.value)} style={{ width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 40, padding: '0 13px', fontFamily: 'inherit', fontSize: 14, color: '#2f3b45', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
            <div style={{ fontSize: 11.5, color: '#9aa7b2', marginTop: 6 }}>วันและเวลาจะถูกบันทึกอัตโนมัติเมื่อกดยืนยัน</div>
          </div>

          <div style={{ display: 'flex', gap: 9 }}>
            <div onClick={onClose} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, border: '1px solid #e4e8ec', borderRadius: 11, fontSize: 14, color: '#5b6b77', fontWeight: 500, cursor: 'pointer' }}>ยกเลิก</div>
            <button onClick={save} disabled={saving} style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, borderRadius: 11, background: '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)', border: 'none', opacity: saving ? 0.7 : 1 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19 }}>check</span>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการส่ง'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
