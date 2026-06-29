'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { printDocNode } from '@/lib/printDoc'
import QuotationDoc from '@/components/QuotationDoc'
import { companyFromSettings, type CompanyInfo } from '@/lib/company'

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
  terms?: string
  projectId?: string | null
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

interface BankView { name: string; type: string; no: string; holder: string; brand: string; icon: string }

function bankBrand(name: string): { brand: string; icon: string } {
  const n = name || ''
  if (n.includes('กสิกร') || /kbank/i.test(n)) return { brand: '#1aa84a', icon: 'eco' }
  if (n.includes('ไทยพาณิชย์') || /scb/i.test(n)) return { brand: '#4e2a84', icon: 'savings' }
  if (n.includes('กรุงเทพ') || /bbl/i.test(n)) return { brand: '#1e4598', icon: 'account_balance' }
  if (n.includes('พร้อมเพย์') || /promptpay/i.test(n)) return { brand: '#0a3a6b', icon: 'qr_code_2' }
  if (n.includes('กรุงไทย') || /ktb/i.test(n)) return { brand: '#00a4e4', icon: 'account_balance' }
  if (n.includes('กรุงศรี')) return { brand: '#fdb913', icon: 'account_balance' }
  return { brand: '#5f7d99', icon: 'account_balance' }
}

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [banks, setBanks] = useState<BankView[]>([])
  const [company, setCompany] = useState<CompanyInfo | undefined>(undefined)
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/quotations/${id}`)
      .then(r => r.json())
      .then(data => {
        setQuotation(data)
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

  async function handleSave() {
    if (!quotation) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: quotation.status,
          projectId: quotation.projectId ?? null,
          issueDate: quotation.issueDate,
          expiry: quotation.expiry ?? null,
          items: quotation.items,
          discount: quotation.discount,
          vatEnabled: quotation.vatEnabled,
          paymentTerm: quotation.paymentTerm,
          bankIndex: quotation.bankIndex,
          clientName: quotation.clientName ?? null,
          clientAddress: quotation.clientAddress ?? null,
          clientTaxId: quotation.clientTaxId ?? null,
          clientContact: quotation.clientContact ?? null,
          clientPhone: quotation.clientPhone ?? null,
          notes: quotation.notes ?? null,
          terms: quotation.terms ?? null,
        }),
      })
      const data = await res.json()
      setQuotation(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!quotation) return
    if (!confirm(`ต้องการลบใบเสนอราคา ${quotation.no} ใช่หรือไม่?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/quotations/${id}`, { method: 'DELETE' })
      router.push('/quotation')
    } catch {
      setDeleting(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  function handleExportPdf() {
    if (!quotation) return
    setExporting(true)
    printDocNode(docRef.current, quotation.no)
    setTimeout(() => setExporting(false), 1000)
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

  let terms: string[] | undefined
  try {
    const t = quotation.terms ? JSON.parse(quotation.terms) : null
    if (Array.isArray(t) && t.length) terms = t
  } catch {}

  const st = statusMap[quotation.status] || statusMap.draft

  const customerName = quotation.clientName || quotation.customer?.company || quotation.customer?.name || '—'

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
            onClick={handleExportPdf}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px',
              border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77',
              fontWeight: 500, cursor: exporting ? 'wait' : 'pointer', background: '#fff',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>picture_as_pdf</span>
            {exporting ? 'กำลังสร้าง...' : 'Export PDF'}
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
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px',
              borderRadius: 10, background: saved ? '#3d8a64' : '#5f7d99', color: '#fff',
              fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              border: 'none', opacity: saving ? 0.7 : 1,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{saved ? 'check_circle' : 'save'}</span>
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึกข้อมูลใบเสนอราคา'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                width: 40, height: 40, border: '1px solid #e4e8ec', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: menuOpen ? '#f5f7f9' : '#fff',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5b6b77' }}>more_horiz</span>
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 41,
                  background: '#fff', borderRadius: 12, border: '1px solid #edf0f3',
                  boxShadow: '0 8px 24px rgba(30,45,60,.14)', overflow: 'hidden', minWidth: 160,
                }}>
                  <button
                    onClick={() => { setMenuOpen(false); handleDelete() }}
                    disabled={deleting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                      padding: '11px 16px', border: 'none', background: '#fff',
                      fontSize: 13.5, fontWeight: 500, color: '#c4593f', cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#fbe9e5'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#fff'}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 19 }}>delete</span>
                    {deleting ? 'กำลังลบ...' : 'ลบใบเสนอราคา'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Document Card */}
      <div ref={docRef} className="print-doc" style={{
        background: '#ffffff', borderRadius: 14, border: '1px solid #edf0f3',
        padding: '46px 48px', maxWidth: 860, margin: '0 auto',
      }}>
        <QuotationDoc
          no={quotation.no}
          status={quotation.status}
          issueDate={quotation.issueDate}
          expiry={quotation.expiry}
          clientName={customerName}
          clientAddress={quotation.clientAddress}
          clientTaxId={quotation.clientTaxId}
          clientContact={quotation.clientContact}
          clientPhone={quotation.clientPhone}
          items={items}
          discount={quotation.discount}
          vatEnabled={quotation.vatEnabled}
          paymentTerm={quotation.paymentTerm}
          bankIndex={quotation.bankIndex}
          banks={banks}
          notes={quotation.notes}
          terms={terms}
          projectName={quotation.projectName}
          ownerName={quotation.ownerName}
          company={company}
        />
      </div>
    </div>
  )
}
