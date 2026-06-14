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

interface Document {
  id: string
  no: string
  type: 'invoice' | 'receipt' | 'taxinvoice'
  status: string
  issueDate: string
  dueDate?: string
  clientName?: string
  clientAddress?: string
  clientTaxId?: string
  clientContact?: string
  clientPhone?: string
  items: string
  discount: number
  vatEnabled: boolean
  bankIndex?: number
  payMethod?: string
  payDate?: string
  payRef?: string
  delivery?: string
  notes?: string
  quotationId?: string
}

const typeConfig = {
  invoice: { label: 'ใบแจ้งหนี้', labelEn: 'INVOICE', icon: 'receipt_long', color: '#6b96c2', bg: '#e8f1f9' },
  receipt: { label: 'ใบเสร็จรับเงิน', labelEn: 'RECEIPT', icon: 'check_circle', color: '#3d8a64', bg: '#e9f3ed' },
  taxinvoice: { label: 'ใบกำกับภาษี', labelEn: 'TAX INVOICE', icon: 'gavel', color: '#9c7c5a', bg: '#f5ece3' },
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: 'ร่าง', bg: '#f0f2f5', color: '#8a97a2' },
  sent: { label: 'ส่งแล้ว', bg: '#e8f1f9', color: '#6b96c2' },
  paid: { label: 'ชำระแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
  overdue: { label: 'เกินกำหนด', bg: '#fceee8', color: '#e07b54' },
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

type DocTypeKey = keyof typeof typeConfig

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/documents/${id}`)
      .then(r => r.json())
      .then(data => {
        setDocument(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function handleSend() {
    if (!document) return
    if (!confirm('ต้องการเปลี่ยนสถานะเป็น "ส่งแล้ว"?')) return
    setUpdating(true)
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    })
    const data = await res.json()
    setDocument(data)
    setUpdating(false)
  }

  async function handleMarkPaid() {
    if (!document) return
    if (!confirm('ต้องการเปลี่ยนสถานะเป็น "ชำระแล้ว"?')) return
    setUpdating(true)
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    })
    const data = await res.json()
    setDocument(data)
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

  if (!document) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#7a8893' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: '#d0d8e0' }}>error</span>
        ไม่พบเอกสาร
      </div>
    )
  }

  let items: Item[] = []
  try {
    items = typeof document.items === 'string' ? JSON.parse(document.items) : document.items
  } catch {}

  const sub = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = sub - (document.discount || 0)
  const vat = document.vatEnabled ? afterDiscount * 0.07 : 0
  const total = afterDiscount + vat
  const tc = typeConfig[document.type as DocTypeKey] || typeConfig.invoice
  const sc = statusConfig[document.status] || statusConfig.draft
  const bank = BANKS[document.bankIndex ?? 0] || BANKS[0]
  const isReceipt = document.type === 'receipt'
  const isTaxInvoice = document.type === 'taxinvoice'

  return (
    <div>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
          .no-print { display: none !important; }
          body * { visibility: hidden !important; }
          .print-doc, .print-doc * { visibility: visible !important; }
          .print-doc {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Action bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#7a8893' }}>
          <Link href="/documents" style={{ color: '#5f7d99', textDecoration: 'none', fontWeight: 600 }}>เอกสาร</Link>
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
          <span style={{ color: '#2f3b45', fontWeight: 600 }}>{document.no}</span>
          <span style={{
            background: tc.bg, color: tc.color,
            borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600, marginLeft: 4,
          }}>{tc.label}</span>
          <span style={{
            background: sc.bg, color: sc.color,
            borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600,
          }}>{sc.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push(`/documents/new?type=${document.type}`)}
            style={{ background: '#f0f2f5', color: '#5f7d99', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit</span>
            แก้ไข
          </button>
          <button
            onClick={() => {
              const prev = window.document.title
              window.document.title = document.no
              setTimeout(() => { window.print(); window.document.title = prev }, 60)
            }}
            style={{ background: '#e8eef4', color: '#5f7d99', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>print</span>
            Export PDF
          </button>
          {document.status === 'draft' && (
            <button
              onClick={handleSend}
              disabled={updating}
              style={{ background: '#e8f1f9', color: '#6b96c2', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>
              ส่งให้ลูกค้า
            </button>
          )}
          {document.type === 'invoice' && document.status === 'sent' && (
            <button
              onClick={handleMarkPaid}
              disabled={updating}
              style={{ background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check_circle</span>
              บันทึกชำระแล้ว
            </button>
          )}
        </div>
      </div>

      {/* Document */}
      <div className="print-doc" style={{
        background: '#fff', borderRadius: 18, padding: '48px 56px', maxWidth: 800,
        margin: '0 auto', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', fontSize: 13, color: '#1a2630',
        position: 'relative',
      }}>
        {/* PAID Stamp for receipt */}
        {isReceipt && document.status === 'paid' && (
          <div style={{
            position: 'absolute', top: 56, right: 56, opacity: 0.18,
            border: '4px solid #3d8a64', borderRadius: 8, padding: '8px 20px',
            color: '#3d8a64', fontSize: 28, fontWeight: 900, letterSpacing: '0.15em',
            transform: 'rotate(-12deg)', pointerEvents: 'none',
          }}>
            PAID
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #edf0f3' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#5f7d99', letterSpacing: '-0.5px', lineHeight: 1 }}>mew.you</div>
            <div style={{ fontSize: 11, color: '#9aa7b2', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>Design Studio</div>
            <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 8 }}>123 ถ.สุขุมวิท กรุงเทพมหานคร 10110</div>
            <div style={{ fontSize: 12, color: '#9aa7b2' }}>โทร: 02-xxx-xxxx | mewyou@gmail.com</div>
            <div style={{ fontSize: 12, color: '#9aa7b2' }}>เลขผู้เสียภาษี: 0-0000-00000-00-0</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45' }}>{tc.label}</div>
            <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 2 }}>{tc.labelEn}</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <span style={{ color: '#9aa7b2' }}>เลขที่:</span>
                <span style={{ fontWeight: 700, color: '#2f3b45' }}>{document.no}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <span style={{ color: '#9aa7b2' }}>วันที่:</span>
                <span style={{ color: '#4a5a67' }}>{document.issueDate}</span>
              </div>
              {document.dueDate && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                  <span style={{ color: '#9aa7b2' }}>ครบกำหนด:</span>
                  <span style={{ color: '#e07b54', fontWeight: 600 }}>{document.dueDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client + Issuer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #edf0f3' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
              {isReceipt ? 'ได้รับเงินจาก' : 'เรียน'}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#2f3b45' }}>{document.clientName || '—'}</div>
            {document.clientAddress && (
              <div style={{ color: '#7a8893', marginTop: 6, lineHeight: 1.7, fontSize: 13 }}>{document.clientAddress}</div>
            )}
            {document.clientContact && (
              <div style={{ marginTop: 8, color: '#4a5a67' }}>ผู้ติดต่อ: {document.clientContact}</div>
            )}
            {document.clientPhone && (
              <div style={{ color: '#4a5a67' }}>โทร: {document.clientPhone}</div>
            )}
            {document.clientTaxId && (
              <div style={{ color: '#4a5a67' }}>เลขภาษี: {document.clientTaxId}</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>ผู้ออกเอกสาร</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#2f3b45' }}>mew.you Design Studio</div>
            <div style={{ color: '#7a8893', marginTop: 6, lineHeight: 1.7, fontSize: 13 }}>
              123 ถ.สุขุมวิท แขวงคลองเตย<br />
              กรุงเทพมหานคร 10110
            </div>
            <div style={{ marginTop: 8, color: '#4a5a67' }}>โทร: 02-xxx-xxxx</div>
            <div style={{ color: '#4a5a67' }}>Email: mewyou@gmail.com</div>
          </div>
        </div>

        {/* Receipt payment info (green box) */}
        {isReceipt && (document.payMethod || document.payDate) && (
          <div style={{
            background: '#e9f3ed', borderRadius: 12, padding: '14px 18px', marginBottom: 20,
            border: '1px solid #b8d9c5', display: 'flex', gap: 32,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#3d8a64', flexShrink: 0 }}>payments</span>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {document.payMethod && (
                <div>
                  <div style={{ fontSize: 11, color: '#5a9e78', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>วิธีชำระ</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2a6347' }}>{document.payMethod}</div>
                </div>
              )}
              {document.payDate && (
                <div>
                  <div style={{ fontSize: 11, color: '#5a9e78', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>วันที่ชำระ</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2a6347' }}>{document.payDate}</div>
                </div>
              )}
              {document.payRef && (
                <div>
                  <div style={{ fontSize: 11, color: '#5a9e78', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>เลขอ้างอิง</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2a6347' }}>{document.payRef}</div>
                </div>
              )}
            </div>
          </div>
        )}

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
            {document.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: '#7a8893' }}>
                <span>ส่วนลด</span><span>-฿{fmt(document.discount)}</span>
              </div>
            )}
            {document.vatEnabled && (
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

        {/* Payment info for invoice / conditions for tax invoice */}
        {!isTaxInvoice && !isReceipt && (
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
                <div>1. กรุณาชำระภายในวันที่กำหนด</div>
                <div>2. โอนแล้วแจ้งสลิปทาง Line</div>
              </div>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: isTaxInvoice || isReceipt ? 32 : 0, paddingTop: isTaxInvoice || isReceipt ? 20 : 0, borderTop: isTaxInvoice || isReceipt ? '1px solid #edf0f3' : 'none' }}>
          {[isReceipt ? 'ผู้รับเงิน' : 'ผู้ออกเอกสาร', isReceipt ? 'ผู้จ่ายเงิน' : 'ผู้รับเอกสาร'].map(role => (
            <div key={role} style={{ textAlign: 'center' }}>
              <div style={{ height: 64, borderBottom: '1px solid #2f3b45', marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>{role}</div>
              <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 6 }}>วันที่: ___/___/______</div>
            </div>
          ))}
        </div>

        {document.notes && (
          <div style={{ marginTop: 28, padding: 16, background: '#f9fafb', borderRadius: 10, fontSize: 13, color: '#7a8893', borderLeft: '3px solid #d0d8e0' }}>
            <span style={{ fontWeight: 700, color: '#2f3b45' }}>หมายเหตุ: </span>
            {document.notes}
          </div>
        )}

        {/* Original quotation reference */}
        {document.quotationId && (
          <div className="no-print" style={{ marginTop: 16, padding: '10px 14px', background: '#e8eef4', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#5f7d99' }}>link</span>
            <span style={{ color: '#5f7d99' }}>อ้างอิงจาก:</span>
            <Link href={`/quotation/${document.quotationId}`} style={{ color: '#5f7d99', fontWeight: 700, textDecoration: 'none' }}>
              ดูใบเสนอราคา
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
