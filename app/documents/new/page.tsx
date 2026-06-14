'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DocumentDoc, { BankView, bankBrand as docBankBrand } from '@/components/DocumentDoc'
import { printDocNode } from '@/lib/printDoc'
import { companyFromSettings, type CompanyInfo } from '@/lib/company'
import { readSlip, type SlipData } from '@/lib/slipOcr'

interface Customer {
  id: string
  name: string
  company?: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
  contact?: string
}

interface Quotation {
  id: string
  no: string
  clientName?: string
  clientAddress?: string
  clientTaxId?: string
  clientContact?: string
  clientPhone?: string
  items: string
  discount: number
  vatEnabled: boolean
}

interface DocumentRef {
  id: string
  no: string
  clientName?: string
  clientAddress?: string
  clientTaxId?: string
  clientContact?: string
  clientPhone?: string
  items?: string | Item[]
  discount?: number
  vatEnabled?: boolean
}

interface BankAccount {
  id: string
  bank: string
  accountNo: string
  name: string
  isDefault?: boolean
}

interface Item {
  name: string
  detail: string
  qty: number
  unit: string
  price: number
}

type DocType = 'invoice' | 'receipt' | 'taxinvoice'

const typeConfig: Record<DocType, { label: string; prefix: string; icon: string; bg: string; color: string }> = {
  invoice: { label: 'ใบแจ้งหนี้', prefix: 'INV', icon: 'receipt_long', bg: '#e8f1f9', color: '#6b96c2' },
  receipt: { label: 'ใบเสร็จรับเงิน', prefix: 'REC', icon: 'payments', bg: '#e9f3ed', color: '#3d8a64' },
  taxinvoice: { label: 'ใบกำกับภาษี', prefix: 'TAX', icon: 'article', bg: '#f5ece3', color: '#9c7c5a' },
}

const PAY_METHODS = ['โอนเงิน', 'เงินสด', 'บัตรเครดิต', 'เช็ค']

const FALLBACK_BANKS: BankAccount[] = [
  { id: 'kbank', bank: 'ธนาคารกสิกรไทย', accountNo: '041-8-63463-4', name: 'ออมทรัพย์' },
  { id: 'scb', bank: 'ธนาคารไทยพาณิชย์', accountNo: '264-2-51789-0', name: 'ออมทรัพย์' },
  { id: 'bbl', bank: 'ธนาคารกรุงเทพ', accountNo: '195-0-44217-6', name: 'กระแสรายวัน' },
  { id: 'promptpay', bank: 'พร้อมเพย์', accountNo: '0-1055-60143-09-9', name: 'PromptPay' },
]

function bankBrand(name: string): { color: string; icon: string } {
  if (name.includes('กสิกร')) return { color: '#1aa84a', icon: 'eco' }
  if (name.includes('ไทยพาณิชย์')) return { color: '#4e2a84', icon: 'savings' }
  if (name.includes('กรุงเทพ')) return { color: '#1e4598', icon: 'account_balance' }
  if (name.includes('พร้อมเพย์')) return { color: '#0a3a6b', icon: 'qr_code_2' }
  return { color: '#5f7d99', icon: 'account_balance' }
}

function fmt(n: number) {
  return (Math.floor(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function thaiToday() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear() + 543
  return `${dd}/${mm}/${yy}`
}

function calcSummary(items: Item[], discount: number, vatEnabled: boolean) {
  const sub = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = sub - discount
  const vat = vatEnabled ? afterDiscount * 0.07 : 0
  return { sub, vat, total: afterDiscount + vat }
}

function compressImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('no ctx')); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = String(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const qInput: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 38,
  padding: '0 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#2f3b45',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24,
}

const cardTitle: React.CSSProperties = {
  fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 16,
}

const fieldLabel: React.CSSProperties = {
  fontSize: 12.5, color: '#7a8893', marginBottom: 6,
}

function NewDocumentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const docType = ((searchParams.get('type') as DocType) || 'invoice') as DocType
  const cfg = typeConfig[docType] || typeConfig.invoice

  const [customers, setCustomers] = useState<Customer[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [refInvoices, setRefInvoices] = useState<DocumentRef[]>([])
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [docCount, setDocCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [company, setCompany] = useState<CompanyInfo | undefined>(undefined)
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'reading' | 'done' | 'fail'>('idle')
  const [ocrData, setOcrData] = useState<SlipData | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const today = thaiToday()

  const [form, setForm] = useState({
    customerId: '',
    quotationId: '',
    refInvoiceId: '',
    issueDate: today,
    dueDate: '',
    items: [{ name: '', detail: '', qty: 1, unit: 'งาน', price: 0 }] as Item[],
    discount: 0,
    vatEnabled: true,
    bankIndex: 0,
    payMethod: 'โอนเงิน',
    payDate: today,
    payRef: '',
    slipUrl: '',
    slipOcr: '',
    status: docType === 'receipt' ? 'paid' : 'draft',
    clientName: '',
    clientAddress: '',
    clientTaxId: '',
    clientContact: '',
    clientPhone: '',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/banks').then(r => r.json()).then(d => setBanks(Array.isArray(d) && d.length ? d : [])).catch(() => {})
    if (docType === 'receipt') {
      fetch('/api/documents?type=invoice').then(r => r.json()).then(d => setRefInvoices(Array.isArray(d) ? d : [])).catch(() => {})
    } else {
      fetch('/api/quotations').then(r => r.json()).then(d => setQuotations(Array.isArray(d) ? d : [])).catch(() => {})
    }
    fetch(`/api/documents?type=${docType}`).then(r => r.json()).then(d => setDocCount(Array.isArray(d) ? d.length : 0)).catch(() => {})
    fetch('/api/settings').then(r => r.json()).then(s => setCompany(companyFromSettings(s))).catch(() => {})
  }, [docType])

  const bankList = banks.length ? banks : FALLBACK_BANKS
  const dcNo = `${cfg.prefix}-${new Date().getFullYear() + 543}-${String(docCount + 1).padStart(4, '0')}`

  const dueLabel = docType === 'invoice' ? 'ครบกำหนดชำระ' : docType === 'receipt' ? 'วันที่รับชำระ' : 'วันที่'
  const refLabel = docType === 'receipt' ? 'อ้างอิงใบแจ้งหนี้' : 'อ้างอิงใบเสนอราคา'

  function setField(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleCustomerChange(id: string) {
    const c = customers.find(x => x.id === id)
    setForm(f => ({
      ...f,
      customerId: id,
      clientName: c?.company || c?.name || '',
      clientAddress: c?.address || '',
      clientTaxId: c?.taxId || '',
      clientContact: c?.contact || c?.name || '',
      clientPhone: c?.phone || '',
    }))
  }

  function handleQuotationChange(id: string) {
    const q = quotations.find(x => x.id === id)
    if (!q) { setField('quotationId', id); return }
    let items: Item[] = []
    try { items = typeof q.items === 'string' ? JSON.parse(q.items) : q.items } catch {}
    setForm(f => ({
      ...f,
      quotationId: id,
      clientName: q.clientName || f.clientName,
      clientAddress: q.clientAddress || f.clientAddress,
      clientTaxId: q.clientTaxId || f.clientTaxId,
      clientContact: q.clientContact || f.clientContact,
      clientPhone: q.clientPhone || f.clientPhone,
      items: items.length > 0 ? items : f.items,
      discount: q.discount ?? f.discount,
      vatEnabled: q.vatEnabled ?? f.vatEnabled,
    }))
  }

  function handleRefInvoiceChange(id: string) {
    const inv = refInvoices.find(x => x.id === id)
    if (!inv) { setField('refInvoiceId', id); return }
    let items: Item[] = []
    try { items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []) } catch {}
    setForm(f => ({
      ...f,
      refInvoiceId: id,
      clientName: inv.clientName || f.clientName,
      clientAddress: inv.clientAddress || f.clientAddress,
      clientTaxId: inv.clientTaxId || f.clientTaxId,
      clientContact: inv.clientContact || f.clientContact,
      clientPhone: inv.clientPhone || f.clientPhone,
      items: items.length > 0 ? items : f.items,
      discount: inv.discount ?? f.discount,
      vatEnabled: inv.vatEnabled ?? f.vatEnabled,
    }))
  }

  function updateItem(idx: number, key: keyof Item, value: string | number) {
    setForm(f => {
      const items = [...f.items]
      items[idx] = { ...items[idx], [key]: value }
      return { ...f, items }
    })
  }
  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { name: '', detail: '', qty: 1, unit: 'งาน', price: 0 }] }))
  }
  function removeItem(idx: number) {
    setForm(f => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== idx) : f.items }))
  }

  async function handleSlipFile(file: File | undefined) {
    if (!file) return
    try {
      const url = await compressImage(file, 1000)
      setField('slipUrl', url)
    } catch {}
    // Read the slip with OCR and auto-fill the payment fields.
    setOcrStatus('reading')
    setOcrData(null)
    try {
      const data = await readSlip(file)
      if (data.ok) {
        setOcrData(data)
        setForm(f => ({
          ...f,
          payRef: data.ref || data.transactionId || f.payRef,
          payDate: data.date || f.payDate,
          slipOcr: JSON.stringify(data),
        }))
        setOcrStatus('done')
      } else {
        setOcrStatus('fail')
        setForm(f => ({ ...f, slipOcr: '' }))
      }
    } catch {
      setOcrStatus('fail')
    }
  }

  const { sub, vat, total } = calcSummary(form.items, form.discount, form.vatEnabled)
  const bank = bankList[form.bankIndex] || bankList[0]
  const brand = bankBrand(bank?.bank || '')
  const previewBanks: BankView[] = bankList.map(b => ({ name: b.bank, type: '', no: b.accountNo, holder: b.name, ...docBankBrand(b.bank) }))
  const showBankCard = docType === 'invoice' || docType === 'taxinvoice'
  const incomplete = !form.customerId || !form.items.some(i => i.name.trim())
  const previewRefNo = docType === 'receipt'
    ? refInvoices.find(d => d.id === form.refInvoiceId)?.no
    : quotations.find(q => q.id === form.quotationId)?.no

  async function handleSave(status: string, dest: 'list' | 'detail' = 'detail') {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: form.customerId || null,
          quotationId: docType === 'receipt' ? null : (form.quotationId || null),
          refInvoiceId: docType === 'receipt' ? (form.refInvoiceId || null) : null,
          type: docType,
          status,
          issueDate: form.issueDate,
          dueDate: form.dueDate || null,
          items: form.items,
          discount: form.discount || 0,
          vatEnabled: form.vatEnabled,
          bankIndex: form.bankIndex,
          payMethod: form.payMethod || null,
          payDate: form.payDate || null,
          payRef: form.payRef || null,
          slipUrl: form.slipUrl || null,
          slipOcr: form.slipOcr || null,
          clientName: form.clientName || null,
          clientAddress: form.clientAddress || null,
          clientTaxId: form.clientTaxId || null,
          clientContact: form.clientContact || null,
          clientPhone: form.clientPhone || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      router.push(dest === 'list' ? '/documents' : `/documents/${data.id}`)
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setSaving(false)
    }
  }

  const headerBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px',
    border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77',
    fontWeight: 500, cursor: 'pointer', background: '#fff',
  }

  const toggleTrack = (on: boolean): React.CSSProperties => ({
    width: 42, height: 24, borderRadius: 12, background: on ? '#5f7d99' : '#d4dce2',
    position: 'relative', cursor: 'pointer', transition: 'background .15s', flexShrink: 0,
  })
  const toggleKnob = (on: boolean): React.CSSProperties => ({
    position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%',
    background: '#fff', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,.2)',
  })

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    border: `2px solid ${active ? '#5f7d99' : '#edf0f3'}`, background: active ? '#e8eef4' : '#fff',
    color: active ? '#5f7d99' : '#7a8893',
  })

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 6px' }}>
        <Link href="/documents" style={{ color: '#9aa7b2', textDecoration: 'none' }}>เอกสารทั้งหมด</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500 }}>สร้าง{cfg.label}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '0 0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>{cfg.icon}</span>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45' }}>สร้าง{cfg.label}</div>
            <div style={{ fontSize: 13, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{dcNo}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <div onClick={() => router.push('/documents')} style={headerBtn}>ยกเลิก</div>
          <div onClick={() => setPreviewOpen(true)} style={headerBtn}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>visibility</span>พรีวิวดูตัวอย่าง
          </div>
          <div onClick={() => handleSave(form.status, 'detail')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', borderRadius: 10, background: '#5f7d99', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)', opacity: saving ? 0.7 : 1 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check</span>{saving ? 'กำลังบันทึก...' : 'บันทึกเอกสาร'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* LEFT */}
        <div style={{ flex: '1.7 1 460px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ข้อมูลทั่วไป */}
          <div style={cardStyle}>
            <div style={cardTitle}>ข้อมูลทั่วไป</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={fieldLabel}>ลูกค้า <span style={{ color: '#c4593f' }}>*</span></div>
                <select value={form.customerId} onChange={e => handleCustomerChange(e.target.value)} style={qInput}>
                  <option value="">— เลือกลูกค้า —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={fieldLabel}>{refLabel}</div>
                {docType === 'receipt' ? (
                  <select value={form.refInvoiceId} onChange={e => handleRefInvoiceChange(e.target.value)} style={qInput}>
                    <option value="">— ไม่ระบุ —</option>
                    {refInvoices.map(d => <option key={d.id} value={d.id}>{d.no} · {d.clientName || '—'}</option>)}
                  </select>
                ) : (
                  <select value={form.quotationId} onChange={e => handleQuotationChange(e.target.value)} style={qInput}>
                    <option value="">— ไม่ระบุ —</option>
                    {quotations.map(q => <option key={q.id} value={q.id}>{q.no} · {q.clientName || '—'}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={fieldLabel}>วันที่ออก</div>
                <input type="date" value={form.issueDate} onChange={e => setField('issueDate', e.target.value)} style={qInput} />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={fieldLabel}>{dueLabel}</div>
                <input type="date" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} style={qInput} />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={fieldLabel}>สถานะ</div>
                <select value={form.status} onChange={e => setField('status', e.target.value)} style={qInput}>
                  <option value="draft">ร่าง</option>
                  <option value="sent">ส่งแล้ว</option>
                  <option value="paid">ชำระแล้ว</option>
                </select>
              </div>
            </div>
          </div>

          {/* ข้อมูลการรับชำระเงิน (receipt only) */}
          {docType === 'receipt' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5f9b78' }}>payments</span>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>ข้อมูลการรับชำระเงิน</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...fieldLabel, marginBottom: 9 }}>วิธีชำระเงิน</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PAY_METHODS.map(m => (
                    <div key={m} onClick={() => setField('payMethod', m)} style={chipStyle(form.payMethod === m)}>{m}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={fieldLabel}>วันที่รับชำระ</div>
                  <input type="date" value={form.payDate} onChange={e => setField('payDate', e.target.value)} style={qInput} />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={fieldLabel}>อ้างอิงการชำระ / เลขที่โอน</div>
                  <input value={form.payRef} onChange={e => setField('payRef', e.target.value)} placeholder="เช่น เลขอ้างอิงสลิป, เลขเช็ค" style={qInput} />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ ...fieldLabel, marginBottom: 9 }}>สลิปการโอนเงิน</div>
                {!form.slipUrl ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 16, border: '1.5px dashed #c9d7cf', borderRadius: 11, cursor: 'pointer', background: '#f7faf8' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#5f9b78' }}>add_photo_alternate</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#3d6a52' }}>แนบสลิปการโอนเงิน</div>
                      <div style={{ fontSize: 12, color: '#8aa698' }}>ระบบจะอ่านข้อมูลจากสลิปอัตโนมัติ (OCR) · รองรับทุกธนาคาร, QR / Mobile Banking</div>
                    </div>
                    <input type="file" accept="image/*" onChange={e => handleSlipFile(e.target.files?.[0])} style={{ display: 'none' }} />
                  </label>
                ) : (
                  <div style={{ border: '1px solid #d6e7dd', borderRadius: 11, background: '#f7faf8', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 13 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.slipUrl} alt="slip" style={{ width: 48, height: 48, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {ocrStatus === 'reading' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#a9762f', fontWeight: 600 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>autorenew</span>กำลังอ่านข้อมูลจากสลิป (OCR)...
                          </div>
                        ) : ocrStatus === 'done' ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3d8a64', fontWeight: 600 }}>
                              <span className="material-symbols-rounded" style={{ fontSize: 17 }}>check_circle</span>อ่านสลิปสำเร็จ · เติมข้อมูลให้อัตโนมัติ
                            </div>
                            <div style={{ fontSize: 12, color: '#8aa698', marginTop: 2 }}>ตรวจสอบ/แก้ไขข้อมูลด้านล่างได้ก่อนบันทึก</div>
                          </>
                        ) : ocrStatus === 'fail' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c4593f', fontWeight: 600 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>error</span>อ่านสลิปไม่สำเร็จ · กรุณากรอกข้อมูลเอง
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3d8a64', fontWeight: 600 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>check_circle</span>แนบสลิปแล้ว
                          </div>
                        )}
                      </div>
                      <div onClick={() => { setField('slipUrl', ''); setField('slipOcr', ''); setOcrStatus('idle'); setOcrData(null) }} style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#c3cdd6' }}>delete</span>
                      </div>
                    </div>
                    {ocrStatus === 'done' && ocrData && (
                      <div style={{ borderTop: '1px solid #e0efe7', padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12 }}>
                        {[
                          ['จำนวนเงิน', ocrData.amount != null ? '฿' + ocrData.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '—'],
                          ['วันที่/เวลา', ocrData.date || '—'],
                          ['เลขอ้างอิง', ocrData.ref || ocrData.transactionId || '—'],
                          ['ธนาคารต้นทาง', ocrData.fromBank || '—'],
                          ['ธนาคารปลายทาง', ocrData.toBank || '—'],
                          ['ผู้โอน', ocrData.sender || '—'],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ color: '#8aa698' }}>{k}</span>
                            <span style={{ color: '#2f5a45', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* รายการ */}
          <div style={cardStyle}>
            <div style={cardTitle}>รายการ</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 66px 100px 92px 30px', gap: 9, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 2px 10px' }}>
              <div>รายการ</div>
              <div style={{ textAlign: 'center' }}>จำนวน</div>
              <div style={{ textAlign: 'center' }}>หน่วย</div>
              <div style={{ textAlign: 'right' }}>ราคา/หน่วย</div>
              <div style={{ textAlign: 'right' }}>รวม</div>
              <div />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 66px 100px 92px 30px', gap: 9, alignItems: 'center' }}>
                  <input value={it.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="ชื่อรายการ" style={qInput} />
                  <input type="number" value={it.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} style={{ width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 38, padding: '0 8px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13.5, color: '#2f3b45', outline: 'none', textAlign: 'center', background: '#fff', boxSizing: 'border-box' }} />
                  <input value={it.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} style={{ width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 38, padding: '0 8px', fontFamily: 'inherit', fontSize: 13, color: '#2f3b45', outline: 'none', textAlign: 'center', background: '#fff', boxSizing: 'border-box' }} />
                  <input type="number" value={it.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} style={{ width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 38, padding: '0 10px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13.5, color: '#2f3b45', outline: 'none', textAlign: 'right', background: '#fff', boxSizing: 'border-box' }} />
                  <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 13, fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{fmt(it.qty * it.price)}</div>
                  <div onClick={() => removeItem(idx)} style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#c3cdd6' }}>delete</span>
                  </div>
                </div>
              ))}
            </div>
            <div onClick={addItem} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14, padding: '10px 14px', border: '1.5px dashed #d4dce2', borderRadius: 10, fontSize: 13.5, fontWeight: 500, color: '#5f7d99', cursor: 'pointer' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19 }}>add</span>เพิ่มรายการ
            </div>
          </div>

          {/* หมายเหตุ */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 12 }}>หมายเหตุ</div>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="เงื่อนไข วิธีชำระเงิน ฯลฯ" style={{ width: '100%', minHeight: 70, border: '1px solid #e4e8ec', borderRadius: 10, padding: '11px 13px', fontFamily: 'inherit', fontSize: 13.5, color: '#5b6b77', outline: 'none', resize: 'vertical', background: '#fff', boxSizing: 'border-box', lineHeight: 1.5 }} />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ width: 320, flex: '1 1 280px', position: 'sticky', top: 6, background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>สรุปยอด</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>รวมเป็นเงิน</span>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{fmt(sub)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>ส่วนลด</span>
              <input type="number" value={form.discount} onChange={e => setField('discount', Number(e.target.value))} style={{ width: 120, border: '1px solid #e4e8ec', borderRadius: 9, height: 36, padding: '0 12px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13.5, color: '#c4593f', outline: 'none', textAlign: 'right', background: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>ภาษีมูลค่าเพิ่ม 7%</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13.5, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{form.vatEnabled ? fmt(vat) : '0.00'}</span>
                <div onClick={() => setField('vatEnabled', !form.vatEnabled)} style={toggleTrack(form.vatEnabled)}><div style={toggleKnob(form.vatEnabled)} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 16, borderTop: '1.5px solid #eef1f4' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>รวมทั้งสิ้น</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{fmt(total)}</span>
            </div>
          </div>

          <div onClick={() => handleSave(form.status, 'detail')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 46, borderRadius: 12, background: '#5f7d99', color: '#fff', fontSize: 14.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', marginTop: 20, boxShadow: '0 4px 12px rgba(95,125,153,.3)', opacity: saving ? 0.7 : 1 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>save</span>บันทึกเอกสาร
          </div>
          <div onClick={() => setPreviewOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, borderRadius: 12, background: '#fff', border: '1px solid #e4e8ec', color: '#5b6b77', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19 }}>visibility</span>พรีวิวดูตัวอย่าง
          </div>

          {incomplete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, fontSize: 12, color: '#a9762f' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>info</span>เลือกลูกค้าและเพิ่มรายการอย่างน้อย 1 รายการ
            </div>
          )}

          {showBankCard && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1.5px solid #eef1f4' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#3b4954', marginBottom: 9 }}>บัญชีรับชำระเงิน</div>
              <select value={form.bankIndex} onChange={e => setField('bankIndex', Number(e.target.value))} style={{ width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 40, padding: '0 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#2f3b45', outline: 'none', background: '#fff', boxSizing: 'border-box', marginBottom: 11 }}>
                {bankList.map((b, i) => <option key={b.id || i} value={i}>{b.bank} · {b.accountNo}</option>)}
              </select>
              {bank && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#f5f7f9', borderRadius: 11, padding: '12px 13px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: brand.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#fff' }}>{brand.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: '#5b6b77' }}>{bank.bank} · {bank.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{bank.accountNo}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {previewOpen && (
        <div onClick={() => setPreviewOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.45)', zIndex: 60, overflowY: 'auto', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, zIndex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>พรีวิวเอกสาร</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div onClick={() => printDocNode(previewRef.current, dcNo)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', borderRadius: 10, background: '#e8eef4', color: '#5f7d99', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>picture_as_pdf</span>Export PDF
                </div>
                <div onClick={() => setPreviewOpen(false)} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #e4e8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a8893', fontSize: 16, cursor: 'pointer' }}>✕</div>
              </div>
            </div>
            <div ref={previewRef} className="print-doc" style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '46px 48px', maxWidth: 860, margin: '0 auto' }}>
              <DocumentDoc
                type={docType}
                no={dcNo}
                status={form.status}
                issueDate={form.issueDate}
                dueDate={form.dueDate}
                clientName={form.clientName}
                clientAddress={form.clientAddress}
                clientTaxId={form.clientTaxId}
                clientContact={form.clientContact}
                clientPhone={form.clientPhone}
                items={form.items}
                discount={form.discount}
                vatEnabled={form.vatEnabled}
                bankIndex={form.bankIndex}
                banks={previewBanks}
                payMethod={form.payMethod}
                payDate={form.payDate}
                payRef={form.payRef}
                slipUrl={form.slipUrl}
                notes={form.notes}
                quotationId={form.quotationId}
                company={company}
                refNo={previewRefNo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9aa7b2' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 32, marginRight: 10 }}>hourglass_empty</span>
        กำลังโหลด...
      </div>
    }>
      <NewDocumentForm />
    </Suspense>
  )
}
