'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Item {
  name: string
  detail: string
  qty: number
  unit: string
  price: number
}

interface Quotation {
  id: string
  no: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  issueDate: string
  expiry?: string
  clientName?: string
  clientAddress?: string
  clientTaxId?: string
  clientContact?: string
  clientPhone?: string
  items: string
  discount: number
  vatEnabled: boolean
  paymentTerm: string
  bankIndex: number
  notes?: string
  projectName?: string
  ownerName?: string
  customer?: { name: string; company?: string; email?: string }
}

const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label: 'ร่าง',        bg: '#e8eef4', color: '#5f7d99' },
  sent:     { label: 'ส่งแล้ว',     bg: '#fdf3e3', color: '#f4a431' },
  approved: { label: 'อนุมัติแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
  rejected: { label: 'ปฏิเสธ',      bg: '#fceee8', color: '#e07b54' },
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/quotations/${id}`)
      .then(r => r.json())
      .then(data => {
        setQuotation(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function handleSendToClient() {
    if (!quotation) return
    if (!confirm('ต้องการเปลี่ยนสถานะเป็น "ส่งแล้ว"?')) return
    setUpdating(true)
    const res = await fetch(`/api/quotations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    })
    const data = await res.json()
    setQuotation(data)
    setUpdating(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9aa7b2', gap: 10 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 32 }}>hourglass_empty</span>
        กำลังโหลด...
      </div>
    )
  }

  if (!quotation) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#7a8893' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: '#d0d8e0' }}>error</span>
        ไม่พบใบเสนอราคา
      </div>
    )
  }

  let items: Item[] = []
  try {
    items = typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items
  } catch {}

  const sub = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = sub - (quotation.discount || 0)
  const vat = quotation.vatEnabled ? afterDiscount * 0.07 : 0
  const total = afterDiscount + vat
  const st = statusMap[quotation.status] || statusMap.draft

  const customerName = quotation.clientName || quotation.customer?.company || quotation.customer?.name || '—'

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
          .print-doc { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; border: none !important; }
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 6px' }}>
        <Link href="/quotation" style={{ color: '#9aa7b2', textDecoration: 'none' }}>ใบเสนอราคา</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500, fontFamily: "'IBM Plex Sans', monospace" }}>{quotation.no}</span>
      </div>

      {/* Page Header */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '0 0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>ใบเสนอราคา</div>
          <span style={{
            background: st.bg, color: st.color,
            borderRadius: 8, padding: '4px 12px', fontSize: 12.5, fontWeight: 600,
          }}>{st.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px',
              border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77',
              fontWeight: 500, cursor: 'pointer', background: '#fff',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={() => router.push(`/quotation/${id}/edit`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px',
              border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77',
              fontWeight: 500, cursor: 'pointer', background: '#fff',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit</span>
            แก้ไข
          </button>
          <button
            onClick={handleSendToClient}
            disabled={updating}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px',
              borderRadius: 10, background: '#5f7d99', color: '#fff',
              fontSize: 13.5, fontWeight: 600, cursor: updating ? 'not-allowed' : 'pointer',
              border: 'none', opacity: updating ? 0.7 : 1,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>
            ส่งให้ลูกค้า
          </button>
          <button style={{
            width: 40, height: 40, border: '1px solid #e4e8ec', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: '#fff',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5b6b77' }}>more_horiz</span>
          </button>
        </div>
      </div>

      {/* Document Card */}
      <div className="print-doc" style={{
        background: '#ffffff', borderRadius: 14, border: '1px solid #edf0f3',
        padding: '46px 48px', maxWidth: 860, margin: '0 auto',
      }}>

        {/* 1. Top Row: Title + Logo */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#3a4654', lineHeight: 1 }}>ใบเสนอราคา</div>
            <div style={{ fontSize: 15, letterSpacing: 7, color: '#9aa7b2', fontWeight: 500, marginTop: 8 }}>QUOTATION</div>
          </div>
          <div style={{
            width: 82, height: 82, background: '#eef1f4', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 36, color: '#8294a6' }}>business</span>
          </div>
        </div>

        {/* 2. Info Section: Customer + Metadata */}
        <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap', marginBottom: 34 }}>
          {/* Customer info box */}
          <div style={{ flex: '1.15 1 300px' }}>
            <div style={{ background: '#eef1f4', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 16px' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6', marginTop: 1 }}>person</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: '#8a97a2' }}>ลูกค้า / Client</div>
                  <div style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, marginTop: 2 }}>{customerName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '0 16px 13px' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6', marginTop: 1 }}>location_on</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: '#8a97a2' }}>ที่อยู่ / Address</div>
                  <div style={{ fontSize: 13, color: '#4a5763', marginTop: 2, lineHeight: 1.5 }}>
                    {quotation.clientAddress || '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '0 16px 14px' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6', marginTop: 1 }}>badge</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: '#8a97a2' }}>เลขประจำตัวผู้เสียภาษี</div>
                  <div style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, marginTop: 2, fontFamily: "'IBM Plex Sans', monospace" }}>
                    {quotation.clientTaxId || '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', background: '#dde4ea' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#6e8295' }}>contact_page</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: '#7e8b96' }}>ผู้ติดต่อ / Attention</div>
                  <div style={{ fontSize: 14, color: '#3a4654', fontWeight: 700, marginTop: 1 }}>
                    {quotation.clientContact || '—'}
                  </div>
                </div>
              </div>
            </div>
            {quotation.clientPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px 0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6' }}>call</span>
                <span style={{ fontSize: 12.5, color: '#8a97a2' }}>โทร / Tel :</span>
                <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace" }}>{quotation.clientPhone}</span>
              </div>
            )}
          </div>

          {/* Metadata list */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 13, paddingTop: 2 }}>
            {[
              { icon: 'tag', label: 'เลขที่เอกสาร', value: quotation.no },
              { icon: 'calendar_today', label: 'วันที่ออก', value: quotation.issueDate },
              { icon: 'event_available', label: 'วันหมดอายุ', value: quotation.expiry || '—' },
              { icon: 'folder_open', label: 'โปรเจกต์', value: quotation.projectName || '—' },
              { icon: 'person', label: 'ผู้รับผิดชอบ', value: quotation.ownerName || '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>{row.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#6a7884' }}>{row.label}</span>
                <span style={{ color: '#b8c2cb' }}>:</span>
                <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace", minWidth: 120, textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Seller + Contact */}
        <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap', marginBottom: 30 }}>
          {/* Seller info */}
          <div style={{ flex: '1.15 1 300px', display: 'flex', gap: 16 }}>
            <div style={{ width: 96, height: 96, borderRadius: 7, background: '#eef1f4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 40, color: '#8294a6' }}>storefront</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#5a6772', background: '#eef1f4', padding: '4px 12px', borderRadius: 6, marginBottom: 8 }}>
                ผู้ขอเสนอราคา / <span style={{ color: '#8a97a2', fontWeight: 500 }}>Quotation From</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#3a4654' }}>MEWYOU PACKAGING DESIGN</div>
              <div style={{ fontSize: 12, color: '#6a7884', marginTop: 3, lineHeight: 1.55 }}>
                สำนักงานขายใหญ่ บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด<br />
                111/159 ซอย ฉลองกรุง 53 แขวง ลาดกระบัง เขตลาดกระบัง กรุงเทพมหานคร 10520
              </div>
              <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600, marginTop: 6 }}>
                เลขประจำตัวผู้เสียภาษี : <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>0105560143099</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#5a6772', background: '#eef1f4', padding: '4px 12px', borderRadius: 6, marginBottom: 11 }}>
              ติดต่อเรา / <span style={{ color: '#8a97a2', fontWeight: 500 }}>Contact Us</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { icon: 'person', text: 'คุณ มิว' },
                { icon: 'call', text: '099-669-6959', mono: true },
                { icon: 'mail', text: 'mewyoulife@gmail.com' },
                { icon: 'chat', text: '@mewyou.design' },
              ].map(row => (
                <div key={row.icon + row.text} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13, color: '#4a5763' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>{row.icon}</span>
                  <span style={row.mono ? { fontFamily: "'IBM Plex Sans', monospace" } : {}}>{row.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Items Table */}
        <div style={{ border: '1px solid #dde3e8', borderRadius: 7, overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '54px 1fr 84px 74px 116px 116px',
            background: '#aebfcd', color: '#33414e', fontSize: 12, fontWeight: 600,
          }}>
            <div style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
              ลำดับ<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>No.</div>
            </div>
            <div style={{ padding: '9px 12px', borderRight: '1px solid #c2cfda' }}>
              รายละเอียด / <span style={{ fontWeight: 400 }}>Description</span>
            </div>
            <div style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
              จำนวน<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Quantity</div>
            </div>
            <div style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
              หน่วย<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Unit</div>
            </div>
            <div style={{ padding: '9px 8px', textAlign: 'right', borderRight: '1px solid #c2cfda' }}>
              ราคาต่อหน่วย<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Unit Price</div>
            </div>
            <div style={{ padding: '9px 8px', textAlign: 'right' }}>
              จำนวนเงิน<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Amount</div>
            </div>
          </div>

          {/* Item Rows */}
          {items.map((item, idx) => (
            <div key={idx} style={{
              display: 'grid', gridTemplateColumns: '54px 1fr 84px 74px 116px 116px',
              fontSize: 13, color: '#3a4654', borderBottom: '1px solid #eef1f4',
            }}>
              <div style={{ padding: '13px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5' }}>{idx + 1}</div>
              <div style={{ padding: '13px 12px', borderRight: '1px solid #f0f2f5' }}>
                <div>{item.name}</div>
                {item.detail && <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 3 }}>{item.detail}</div>}
              </div>
              <div style={{ padding: '13px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5', fontFamily: "'IBM Plex Sans', monospace" }}>{item.qty}</div>
              <div style={{ padding: '13px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5' }}>{item.unit}</div>
              <div style={{ padding: '13px 8px', textAlign: 'right', borderRight: '1px solid #f0f2f5', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(item.price)}</div>
              <div style={{ padding: '13px 8px', textAlign: 'right', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(item.qty * item.price)}</div>
            </div>
          ))}

          {/* Empty lined area */}
          <div style={{
            minHeight: 120,
            background: 'repeating-linear-gradient(#ffffff,#ffffff 43px,#f4f6f8 43px,#f4f6f8 44px)',
          }} />

          {/* Remark footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: '1px solid #e8ebee', background: '#fbfcfd' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>chat</span>
            <span style={{ fontSize: 12.5, color: '#7a8893', fontWeight: 600 }}>หมายเหตุ / Remark</span>
            <span style={{ fontSize: 12.5, color: '#5a6772' }}>{quotation.notes || ''}</span>
          </div>
        </div>

        {/* 5. Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: '#5a6772' }}>ราคารวม</span>
              <span style={{ fontFamily: "'IBM Plex Sans', monospace", color: '#3a4654' }}>฿{fmt(afterDiscount)}</span>
            </div>
            {quotation.vatEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span style={{ color: '#5a6772' }}>ภาษีมูลค่าเพิ่ม 7%</span>
                <span style={{ fontFamily: "'IBM Plex Sans', monospace", color: '#3a4654' }}>฿{fmt(vat)}</span>
              </div>
            )}
            <div style={{ borderTop: '1.5px solid #dde3e8', margin: '2px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#3a4654' }}>รวมทั้งสิ้น</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#3a4654', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* 6. Signatures */}
        <div style={{
          display: 'flex', gap: 40, justifyContent: 'flex-end',
          marginTop: 40, paddingTop: 20, borderTop: '1px dashed #dde3e8',
        }}>
          {[
            { title: 'ผู้ออกเอกสาร', sub: 'Prepared By' },
            { title: 'ผู้มีอำนาจลงนาม', sub: 'Authorized Signatory' },
            { title: 'ลูกค้า', sub: 'Customer' },
          ].map(sig => (
            <div key={sig.title} style={{ textAlign: 'center', minWidth: 160 }}>
              <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 2 }}>
                {sig.title} <span style={{ color: '#a3aeb8' }}>/ {sig.sub}</span>
              </div>
              <div style={{ height: 1, background: '#cdd5dc', margin: '50px 0 8px' }} />
              <div style={{ fontSize: 12.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>วันที่: ___/___/______</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
