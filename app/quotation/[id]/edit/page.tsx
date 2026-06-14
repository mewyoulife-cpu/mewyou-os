'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import QuotationDoc from '@/components/QuotationDoc'
import { printDocNode } from '@/lib/printDoc'
import { companyFromSettings, type CompanyInfo } from '@/lib/company'

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

interface Item {
  id: string
  name: string
  detail: string
  qty: number
  unit: string
  price: number
}

interface BankView { bank: string; no: string; name: string; brand: string; icon: string }

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

const FALLBACK_BANKS: BankView[] = [
  { bank: 'ธนาคารกสิกรไทย', no: '041-8-63463-4', name: 'บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด', brand: '#1aa84a', icon: 'eco' },
  { bank: 'ธนาคารไทยพาณิชย์', no: '264-2-51789-0', name: 'บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด', brand: '#4e2a84', icon: 'savings' },
  { bank: 'ธนาคารกรุงเทพ', no: '195-0-44217-6', name: 'บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด', brand: '#1e4598', icon: 'account_balance' },
  { bank: 'พร้อมเพย์ / PromptPay', no: '0-1055-60143-09-9', name: 'มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค', brand: '#0a3a6b', icon: 'qr_code_2' },
]
const PAY_TERMS = [
  { value: 'deposit50', label: 'มัดจำ 50% ก่อนเริ่มงาน' },
  { value: 'full', label: 'ชำระเต็มจำนวน' },
]
const STATUSES = [
  { value: 'draft', label: 'ร่าง' },
  { value: 'sent', label: 'ส่งแล้ว' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'rejected', label: 'ปฏิเสธ' },
]

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, border: '1px solid #e4e8ec', borderRadius: 10,
  padding: '0 12px', fontSize: 14, color: '#2f3b45', background: '#fff',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24,
}
const labelStyle: React.CSSProperties = {
  fontSize: 12.5, color: '#7a8893', marginBottom: 6, display: 'block',
}
const headingStyle: React.CSSProperties = {
  fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18,
}

export default function EditQuotationPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [company, setCompany] = useState<CompanyInfo | undefined>(undefined)
  const previewRef = useRef<HTMLDivElement>(null)

  const [no, setNo] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [status, setStatus] = useState('draft')
  const [issueDate, setIssueDate] = useState('')
  const [expiry, setExpiry] = useState('')
  const [vatEnabled, setVatEnabled] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [paymentTerm, setPaymentTerm] = useState('deposit50')
  const [bankIndex, setBankIndex] = useState(0)
  const [banks, setBanks] = useState<BankView[]>([])
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientTaxId, setClientTaxId] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/banks').then(r => r.json()).then(d => {
      const list: { bank: string; accountNo: string; name: string }[] = Array.isArray(d) ? d : []
      if (!list.length) return
      setBanks(list.map(b => ({ bank: b.bank, no: b.accountNo, name: b.name, ...bankBrand(b.bank) })))
    }).catch(() => {})
    fetch('/api/settings').then(r => r.json()).then(s => setCompany(companyFromSettings(s))).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/quotations/${id}`)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(q => {
        setNo(q.no || '')
        setCustomerId(q.customerId || '')
        setStatus(q.status || 'draft')
        setIssueDate(q.issueDate || '')
        setExpiry(q.expiry || '')
        setVatEnabled(!!q.vatEnabled)
        setDiscount(q.discount || 0)
        setPaymentTerm(q.paymentTerm || 'deposit50')
        setBankIndex(q.bankIndex || 0)
        setClientName(q.clientName || '')
        setClientAddress(q.clientAddress || '')
        setClientTaxId(q.clientTaxId || '')
        setClientContact(q.clientContact || '')
        setClientPhone(q.clientPhone || '')
        setNotes(q.notes || '')
        let parsed: Item[] = []
        try {
          const raw = typeof q.items === 'string' ? JSON.parse(q.items) : q.items
          parsed = (Array.isArray(raw) ? raw : []).map((it: Partial<Item>) => ({
            id: genId(),
            name: it.name || '',
            detail: it.detail || '',
            qty: Number(it.qty) || 0,
            unit: it.unit || 'งาน',
            price: Number(it.price) || 0,
          }))
        } catch {}
        if (parsed.length === 0) parsed = [{ id: genId(), name: '', detail: '', qty: 1, unit: 'งาน', price: 0 }]
        setItems(parsed)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  function updateItem(itemId: string, key: keyof Item, value: string | number) {
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, [key]: value } : it))
  }
  function addItem() {
    setItems(prev => [...prev, { id: genId(), name: '', detail: '', qty: 1, unit: 'งาน', price: 0 }])
  }
  function removeItem(itemId: string) {
    setItems(prev => prev.filter(it => it.id !== itemId))
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = subtotal - (discount || 0)
  const vat = vatEnabled ? afterDiscount * 0.07 : 0
  const total = afterDiscount + vat

  async function handleSave() {
    if (!customerId && !clientName) return
    setSaving(true)
    try {
      await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || null,
          status,
          issueDate,
          expiry: expiry || null,
          items: items.map(({ name, detail, qty, unit, price }) => ({ name, detail, qty, unit, price })),
          discount: discount || 0,
          vatEnabled,
          paymentTerm,
          bankIndex,
          clientName: clientName || null,
          clientAddress: clientAddress || null,
          clientTaxId: clientTaxId || null,
          clientContact: clientContact || null,
          clientPhone: clientPhone || null,
          notes: notes || null,
        }),
      })
      router.push(`/quotation/${id}`)
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9aa7b2', gap: 10 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 36 }}>hourglass_empty</span>
        <span style={{ fontSize: 14 }}>กำลังโหลด...</span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#7a8893', gap: 12 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 48, opacity: 0.4 }}>error</span>
        <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบใบเสนอราคา</div>
        <Link href="/quotation" style={{ color: '#5f7d99', fontSize: 14 }}>← กลับไปรายการ</Link>
      </div>
    )
  }

  const incomplete = !customerId && !clientName

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 6px' }}>
        <Link href="/quotation" style={{ color: '#9aa7b2', textDecoration: 'none' }}>ใบเสนอราคา</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <Link href={`/quotation/${id}`} style={{ color: '#9aa7b2', textDecoration: 'none', fontFamily: "'IBM Plex Sans', monospace" }}>{no}</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500 }}>แก้ไข</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45', margin: 0 }}>แก้ไขใบเสนอราคา</h1>
          <div style={{ fontSize: 13, color: '#9aa7b2', marginTop: 2, fontFamily: "'IBM Plex Sans', monospace" }}>{no}</div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <Link href={`/quotation/${id}`} style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 16px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, textDecoration: 'none', background: '#fff' }}>ยกเลิก</Link>
          <button
            onClick={() => setPreviewOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, cursor: 'pointer', background: '#fff' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>visibility</span>
            พรีวิวดูตัวอย่าง
          </button>
          <button
            onClick={handleSave}
            disabled={saving || incomplete}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', border: 'none', borderRadius: 10, background: incomplete ? '#c8d4de' : '#5f7d99', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving || incomplete ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>save</span>
            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลใบเสนอราคา'}
          </button>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left */}
        <div style={{ flex: '1.7 1 460px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Card 1: ข้อมูลเอกสาร */}
          <div style={cardStyle}>
            <div style={headingStyle}>ข้อมูลเอกสาร</div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={labelStyle}>ลูกค้า *</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={inputStyle}>
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={labelStyle}>สถานะ</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={labelStyle}>วันที่ออก</label>
                <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={labelStyle}>วันหมดอายุ</label>
                <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Card 2: ข้อมูลลูกค้าในเอกสาร */}
          <div style={cardStyle}>
            <div style={headingStyle}>ข้อมูลลูกค้าในเอกสาร</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>ชื่อลูกค้า (ในเอกสาร)</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="ชื่อ/บริษัทที่จะแสดงในใบเสนอราคา" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ที่อยู่</label>
                <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="ที่อยู่ลูกค้า" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>เลขประจำตัวผู้เสียภาษี</label>
                  <input value={clientTaxId} onChange={e => setClientTaxId(e.target.value)} placeholder="0000000000000" style={inputStyle} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>ผู้ติดต่อ</label>
                  <input value={clientContact} onChange={e => setClientContact(e.target.value)} placeholder="ชื่อผู้ติดต่อ" style={inputStyle} />
                </div>
              </div>
              <div style={{ maxWidth: 280 }}>
                <label style={labelStyle}>เบอร์โทร</label>
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="0xx-xxx-xxxx" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Card 3: รายการสินค้า / บริการ */}
          <div style={cardStyle}>
            <div style={headingStyle}>รายการสินค้า / บริการ</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 84px 74px 116px 116px 36px', gap: 8, padding: '0 4px', marginBottom: 8, fontSize: 11.5, color: '#9aa7b2', fontWeight: 600 }}>
              <div>รายละเอียด</div>
              <div style={{ textAlign: 'center' }}>จำนวน</div>
              <div style={{ textAlign: 'center' }}>หน่วย</div>
              <div style={{ textAlign: 'right' }}>ราคา/หน่วย</div>
              <div style={{ textAlign: 'right' }}>จำนวนเงิน</div>
              <div />
            </div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 84px 74px 116px 116px 36px', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="รายละเอียด" style={inputStyle} />
                  <input value={item.detail} onChange={e => updateItem(item.id, 'detail', e.target.value)} placeholder="รายละเอียดย่อย (ถ้ามี)" style={{ ...inputStyle, height: 34, fontSize: 12.5, color: '#7a8893' }} />
                </div>
                <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} min={0} style={{ ...inputStyle, textAlign: 'center' }} />
                <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} placeholder="งาน" style={inputStyle} />
                <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} min={0} style={{ ...inputStyle, textAlign: 'right' }} />
                <div style={{ height: 40, fontSize: 13.5, fontWeight: 600, color: '#2f3b45', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: "'IBM Plex Sans', monospace" }}>
                  {fmt(item.qty * item.price)}
                </div>
                <button onClick={() => removeItem(item.id)} style={{ width: 36, height: 40, border: '1px solid #e4e8ec', borderRadius: 8, cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>close</span>
                </button>
              </div>
            ))}
            <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, height: 36, padding: '0 14px', borderRadius: 9, background: '#f5f7f9', color: '#5f7d99', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1.5px dashed #c9d7e3' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
              เพิ่มรายการ
            </button>
          </div>

          {/* Card 4: หมายเหตุ / เงื่อนไข */}
          <div style={cardStyle}>
            <div style={headingStyle}>หมายเหตุ / เงื่อนไข</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="เงื่อนไขการชำระเงิน ระยะเวลา ฯลฯ" style={{ width: '100%', minHeight: 80, border: '1px solid #e4e8ec', borderRadius: 10, padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: '#5b6b77', outline: 'none', resize: 'vertical', background: '#fff', boxSizing: 'border-box', lineHeight: 1.5 }} />
          </div>
        </div>

        {/* Right */}
        <div style={{ width: 330, flex: '1 1 290px', position: 'sticky', top: 6, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Options */}
          <div style={cardStyle}>
            <div style={headingStyle}>ตัวเลือกเอกสาร</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
              <input type="checkbox" checked={vatEnabled} onChange={e => setVatEnabled(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#5f7d99', cursor: 'pointer' }} />
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>คิดภาษีมูลค่าเพิ่ม 7% (VAT)</span>
            </label>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>ส่วนลด (บาท)</label>
              <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min={0} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>เงื่อนไขการชำระเงิน</label>
              <select value={paymentTerm} onChange={e => setPaymentTerm(e.target.value)} style={inputStyle}>
                {PAY_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>บัญชีรับชำระเงิน</label>
              <select value={bankIndex} onChange={e => setBankIndex(Number(e.target.value))} style={inputStyle}>
                {(banks.length ? banks : FALLBACK_BANKS).map((b, i) => <option key={i} value={i}>{b.bank} · {b.no}</option>)}
              </select>
              {(() => {
                const list = banks.length ? banks : FALLBACK_BANKS
                const b = list[bankIndex] || list[0]
                if (!b) return null
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#f5f7f9', borderRadius: 11, padding: '12px 13px', marginTop: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: b.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#fff' }}>{b.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: '#5b6b77', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.bank} · {b.name}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', monospace" }}>{b.no}</div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Summary */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 4 }}>สรุปมูลค่า</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ fontSize: 14, color: '#7a8893' }}>ราคารวม</span>
              <span style={{ fontSize: 14, fontFamily: "'IBM Plex Sans', monospace", color: '#2f3b45' }}>฿{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <span style={{ fontSize: 14, color: '#7a8893' }}>ส่วนลด</span>
                <span style={{ fontSize: 14, fontFamily: "'IBM Plex Sans', monospace", color: '#c4593f' }}>-฿{fmt(discount)}</span>
              </div>
            )}
            {vatEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                <span style={{ fontSize: 14, color: '#7a8893' }}>ภาษีมูลค่าเพิ่ม 7%</span>
                <span style={{ fontSize: 14, fontFamily: "'IBM Plex Sans', monospace", color: '#2f3b45' }}>฿{fmt(vat)}</span>
              </div>
            )}
            <div style={{ borderTop: '1.5px solid #eef1f4', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>รวมทั้งสิ้น</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(total)}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || incomplete}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', height: 46, borderRadius: 12, background: incomplete ? '#c8d4de' : '#5f7d99', color: '#fff', fontSize: 14.5, fontWeight: 600, cursor: saving || incomplete ? 'not-allowed' : 'pointer', marginTop: 16, boxShadow: incomplete ? 'none' : '0 4px 12px rgba(95,125,153,.3)', border: 'none', opacity: saving ? 0.7 : 1 }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>save</span>
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลใบเสนอราคา'}
            </button>
            {incomplete && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, fontSize: 12, color: '#a9762f' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>info</span>
                เลือกลูกค้า หรือกรอกชื่อลูกค้าในเอกสารก่อน
              </div>
            )}
          </div>
        </div>
      </div>

      {previewOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.45)', zIndex: 60, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>พรีวิวเอกสาร</span>
              <div style={{ display: 'flex', gap: 9 }}>
                <button onClick={() => printDocNode(previewRef.current, no)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, cursor: 'pointer', background: '#fff' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>picture_as_pdf</span>Export PDF
                </button>
                <button onClick={() => setPreviewOpen(false)} style={{ width: 36, height: 36, border: '1px solid #e4e8ec', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff', fontSize: 15, color: '#5b6b77' }}>✕</button>
              </div>
            </div>
            <div ref={previewRef} className="print-doc" style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '46px 48px', maxWidth: 860, margin: '0 auto' }}>
              <QuotationDoc
                no={no}
                status={status}
                issueDate={issueDate}
                expiry={expiry}
                clientName={clientName}
                clientAddress={clientAddress}
                clientTaxId={clientTaxId}
                clientContact={clientContact}
                clientPhone={clientPhone}
                items={items.map(({ name, detail, qty, unit, price }) => ({ name, detail, qty, unit, price }))}
                discount={discount}
                vatEnabled={vatEnabled}
                paymentTerm={paymentTerm}
                bankIndex={bankIndex}
                banks={banks.map(b => ({ name: b.bank, type: '', no: b.no, holder: b.name, brand: b.brand, icon: b.icon }))}
                notes={notes}
                company={company}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
