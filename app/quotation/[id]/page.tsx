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
  customer?: { name: string; company?: string; email?: string }
}

const statusMap = {
  draft: { label: 'ร่าง', bg: '#f0f2f5', color: '#8a97a2' },
  sent: { label: 'ส่งแล้ว', bg: '#e8f1f9', color: '#6b96c2' },
  approved: { label: 'อนุมัติแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
  rejected: { label: 'ปฏิเสธ', bg: '#fceee8', color: '#e07b54' },
}

const BANKS = [
  { name: 'ธ.กสิกรไทย (KBank)', accountNo: '123-4-56789-0', accountName: 'บจก. มิวยู ดีไซน์' },
  { name: 'ธ.ไทยพาณิชย์ (SCB)', accountNo: '123-456789-0', accountName: 'บจก. มิวยู ดีไซน์' },
  { name: 'ธ.กรุงเทพ (BBL)', accountNo: '123-4-56789-0', accountName: 'บจก. มิวยู ดีไซน์' },
  { name: 'พร้อมเพย์', accountNo: '0812345678', accountName: 'mew.you Studio' },
]

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function thaiNumberToText(amount: number): string {
  const n = Math.round(amount * 100) / 100
  const intPart = Math.floor(n).toLocaleString('th-TH')
  return `(${intPart} บาทถ้วน)`
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9aa7b2' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 32, marginRight: 10 }}>hourglass_empty</span>
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
  const bank = BANKS[quotation.bankIndex] || BANKS[0]

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
          .print-doc { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* Action bar — no-print */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#7a8893' }}>
          <Link href="/quotation" style={{ color: '#5f7d99', textDecoration: 'none', fontWeight: 600 }}>ใบเสนอราคา</Link>
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
          <span style={{ color: '#2f3b45', fontWeight: 600 }}>{quotation.no}</span>
          <span style={{
            background: st.bg, color: st.color,
            borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600, marginLeft: 8,
          }}>{st.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push(`/quotation/new`)}
            style={{ background: '#f0f2f5', color: '#5f7d99', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit</span>
            แก้ไข
          </button>
          <button
            onClick={() => window.print()}
            style={{ background: '#e8eef4', color: '#5f7d99', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>print</span>
            Export PDF
          </button>
          {quotation.status !== 'sent' && quotation.status !== 'approved' && (
            <button
              onClick={handleSendToClient}
              disabled={updating}
              style={{ background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>
              ส่งให้ลูกค้า
            </button>
          )}
        </div>
      </div>

      {/* Document */}
      <div className="print-doc" style={{
        background: '#fff', borderRadius: 18, padding: '48px 56px', maxWidth: 800,
        margin: '0 auto', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', fontSize: 13, color: '#1a2630',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #edf0f3' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#5f7d99', letterSpacing: '-0.5px', lineHeight: 1 }}>mew.you</div>
            <div style={{ fontSize: 11, color: '#9aa7b2', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>Design Studio</div>
            <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 8 }}>123 ถ.สุขุมวิท กรุงเทพมหานคร 10110</div>
            <div style={{ fontSize: 12, color: '#9aa7b2' }}>โทร: 02-xxx-xxxx | mewyou@gmail.com</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45' }}>ใบเสนอราคา</div>
            <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 2 }}>QUOTATION</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#4a5a67' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <span style={{ color: '#9aa7b2' }}>เลขที่:</span>
                <span style={{ fontWeight: 700, color: '#2f3b45' }}>{quotation.no}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <span style={{ color: '#9aa7b2' }}>วันที่:</span>
                <span>{quotation.issueDate}</span>
              </div>
              {quotation.expiry && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                  <span style={{ color: '#9aa7b2' }}>ใช้ได้ถึง:</span>
                  <span>{quotation.expiry}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client + Issuer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #edf0f3' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>เรียน</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#2f3b45' }}>{quotation.clientName || quotation.customer?.name || '—'}</div>
            {quotation.clientAddress && (
              <div style={{ color: '#7a8893', marginTop: 6, lineHeight: 1.7, fontSize: 13 }}>{quotation.clientAddress}</div>
            )}
            {quotation.clientContact && (
              <div style={{ marginTop: 8, color: '#4a5a67' }}>ผู้ติดต่อ: {quotation.clientContact}</div>
            )}
            {quotation.clientPhone && (
              <div style={{ color: '#4a5a67' }}>โทร: {quotation.clientPhone}</div>
            )}
            {quotation.clientTaxId && (
              <div style={{ color: '#4a5a67' }}>เลขภาษี: {quotation.clientTaxId}</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>ผู้เสนอราคา</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#2f3b45' }}>mew.you Design Studio</div>
            <div style={{ color: '#7a8893', marginTop: 6, lineHeight: 1.7, fontSize: 13 }}>
              123 ถ.สุขุมวิท แขวงคลองเตย<br />
              กรุงเทพมหานคร 10110
            </div>
            <div style={{ marginTop: 8, color: '#4a5a67' }}>โทร: 02-xxx-xxxx</div>
            <div style={{ color: '#4a5a67' }}>Email: mewyou@gmail.com</div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f5f7f9' }}>
              <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#7a8893', width: 40 }}>#</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#7a8893' }}>รายการ</th>
              <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#7a8893', width: 60 }}>จำนวน</th>
              <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#7a8893', width: 60 }}>หน่วย</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#7a8893', width: 110 }}>ราคา/หน่วย</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#7a8893', width: 110 }}>จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f2f5' }}>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#9aa7b2', fontSize: 13 }}>{idx + 1}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#2f3b45' }}>{item.name}</div>
                  {item.detail && <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 3 }}>{item.detail}</div>}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#4a5a67' }}>{item.qty}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#4a5a67' }}>{item.unit}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4a5a67' }}>฿{fmt(item.price)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#2f3b45' }}>฿{fmt(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <div style={{ width: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: '#7a8893' }}>
              <span>มูลค่าไม่รวมภาษี</span><span>฿{fmt(sub)}</span>
            </div>
            {quotation.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: '#7a8893' }}>
                <span>ส่วนลด</span><span>-฿{fmt(quotation.discount)}</span>
              </div>
            )}
            {quotation.vatEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: '#7a8893' }}>
                <span>ภาษีมูลค่าเพิ่ม 7%</span><span>฿{fmt(vat)}</span>
              </div>
            )}
            <div style={{ height: 1.5, background: '#2f3b45', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 17, fontWeight: 800, color: '#2f3b45' }}>
              <span>รวมทั้งสิ้น</span>
              <span style={{ color: '#5f7d99' }}>฿{fmt(total)}</span>
            </div>
            <div style={{ fontSize: 12, color: '#9aa7b2', textAlign: 'right', marginTop: 4 }}>
              {thaiNumberToText(total)}
            </div>
          </div>
        </div>

        {/* Payment + Conditions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, paddingTop: 20, paddingBottom: 28, borderTop: '1px solid #edf0f3', borderBottom: '1px solid #edf0f3', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>ชำระเงิน</div>
            <div style={{ fontWeight: 700, color: '#2f3b45', fontSize: 14, marginBottom: 4 }}>{bank.name}</div>
            <div style={{ fontSize: 13, color: '#4a5a67' }}>เลขที่บัญชี: {bank.accountNo}</div>
            <div style={{ fontSize: 13, color: '#4a5a67' }}>ชื่อบัญชี: {bank.accountName}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>เงื่อนไข</div>
            <div style={{ fontSize: 13, color: '#4a5a67', lineHeight: 1.9 }}>
              {quotation.paymentTerm === 'deposit50' ? (
                <>
                  <div>1. มัดจำ 50% ก่อนเริ่มงาน ({fmt(total * 0.5)} บาท)</div>
                  <div>2. ส่งงานภายใน 30 วันทำการ</div>
                  <div>3. แก้ไขได้ 2 ครั้ง</div>
                </>
              ) : (
                <>
                  <div>1. ชำระเต็มจำนวนก่อนรับงาน</div>
                  <div>2. ส่งงานภายใน 30 วันทำการ</div>
                  <div>3. แก้ไขได้ 2 ครั้ง</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
          {['ผู้เสนอราคา', 'ผู้รับเอกสาร'].map(role => (
            <div key={role} style={{ textAlign: 'center' }}>
              <div style={{ height: 64, borderBottom: '1px solid #2f3b45', marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>{role}</div>
              <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 6 }}>วันที่: ___/___/______</div>
            </div>
          ))}
        </div>

        {quotation.notes && (
          <div style={{ marginTop: 28, padding: 16, background: '#f9fafb', borderRadius: 10, fontSize: 13, color: '#7a8893', borderLeft: '3px solid #d0d8e0' }}>
            <span style={{ fontWeight: 700, color: '#2f3b45' }}>หมายเหตุ: </span>
            {quotation.notes}
          </div>
        )}
      </div>
    </div>
  )
}
