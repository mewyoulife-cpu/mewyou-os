'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { printDocNode } from '@/lib/printDoc'
import DocumentDoc, { BankView, bankBrand } from '@/components/DocumentDoc'
import { companyFromSettings, type CompanyInfo } from '@/lib/company'

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
  slipUrl?: string
  delivery?: string
  notes?: string
  quotationId?: string
  refNo?: string
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

type DocTypeKey = keyof typeof typeConfig

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [banks, setBanks] = useState<BankView[]>([])
  const [company, setCompany] = useState<CompanyInfo | undefined>(undefined)
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/documents/${id}`)
      .then(r => r.json())
      .then(data => {
        setDocument(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    fetch('/api/settings').then(r => r.json()).then(s => setCompany(companyFromSettings(s))).catch(() => {})
    fetch('/api/banks').then(r => r.json()).then(d => {
      const list: { bank: string; accountNo: string; name: string }[] = Array.isArray(d) ? d : []
      if (!list.length) return
      setBanks(list.map(b => ({ name: b.bank, type: '', no: b.accountNo, holder: b.name, ...bankBrand(b.bank) })))
    }).catch(() => {})
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

  async function handleDelete() {
    if (!document) return
    if (!confirm(`ต้องการลบ ${document.no} ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`)) return
    setDeleting(true)
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      router.push('/documents')
    } catch {
      setDeleting(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
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

  const tc = typeConfig[document.type as DocTypeKey] || typeConfig.invoice
  const sc = statusConfig[document.status] || statusConfig.draft

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
            onClick={() => router.push(`/documents/${id}/edit`)}
            style={{ background: '#f0f2f5', color: '#5f7d99', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit</span>
            แก้ไข
          </button>
          <button
            onClick={() => printDocNode(docRef.current, document.no)}
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
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ background: '#fff', color: '#c4593f', border: '1px solid #f0d4cc', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete</span>
            {deleting ? 'กำลังลบ...' : 'ลบ'}
          </button>
        </div>
      </div>

      {/* Document */}
      <div ref={docRef} className="print-doc" style={{
        background: '#fff', borderRadius: 14, border: '1px solid #edf0f3',
        padding: '46px 48px', maxWidth: 860, margin: '0 auto', position: 'relative',
      }}>
        <DocumentDoc
          type={document.type}
          no={document.no}
          status={document.status}
          issueDate={document.issueDate}
          dueDate={document.dueDate}
          clientName={document.clientName}
          clientAddress={document.clientAddress}
          clientTaxId={document.clientTaxId}
          clientContact={document.clientContact}
          clientPhone={document.clientPhone}
          items={items}
          discount={document.discount}
          vatEnabled={document.vatEnabled}
          bankIndex={document.bankIndex}
          banks={banks}
          payMethod={document.payMethod}
          payDate={document.payDate}
          payRef={document.payRef}
          slipUrl={document.slipUrl}
          notes={document.notes}
          quotationId={document.quotationId}
          onOpenRef={document.quotationId ? () => router.push(`/quotation/${document.quotationId}`) : undefined}
          company={company}
          refNo={document.refNo}
        />
      </div>
    </div>
  )
}
