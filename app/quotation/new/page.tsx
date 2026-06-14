'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface Project {
  id: string
  name: string
  code: string
}

interface Item {
  name: string
  detail: string
  qty: number
  unit: string
  price: number
}

const SERVICES: [string, number][] = [
  ['Logo Design', 8000],
  ['Label Design', 5000],
  ['Packaging Design', 15000],
  ['3D Mockup', 3000],
  ['Artwork', 2000],
  ['Brochure Design', 6000],
]

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

const qInput: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 38,
  padding: '0 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#2f3b45',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22,
}

const cardTitle: React.CSSProperties = {
  fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 16,
}

const fieldLabel: React.CSSProperties = {
  fontSize: 12.5, color: '#7a8893', marginBottom: 6,
}

export default function NewQuotationPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [banks, setBanks] = useState<BankView[]>([])
  const [quoteNo, setQuoteNo] = useState('QO-25690600003')
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [company, setCompany] = useState<CompanyInfo | undefined>(undefined)
  const previewRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    customerId: '',
    projectId: '',
    issueDate: thaiToday(),
    expiry: '-',
    items: [{ name: '', detail: '', qty: 1, unit: 'งาน', price: 0 }] as Item[],
    discount: 0,
    vatEnabled: true,
    paymentTerm: 'deposit50',
    bankIndex: 0,
    clientName: '',
    clientAddress: '',
    clientTaxId: '',
    clientContact: '',
    clientPhone: '',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/quotations').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : []
      const nums = list.map((q: { no?: string }) => parseInt(String(q.no || '').replace(/\D/g, ''), 10) || 0)
      setQuoteNo('QO-' + (Math.max(25690600002, ...nums) + 1))
    }).catch(() => {})
    fetch('/api/banks').then(r => r.json()).then(d => {
      const list: { bank: string; accountNo: string; name: string; isDefault?: boolean }[] = Array.isArray(d) ? d : []
      if (!list.length) return
      const mapped: BankView[] = list.map(b => ({ bank: b.bank, no: b.accountNo, name: b.name, ...bankBrand(b.bank) }))
      setBanks(mapped)
      const defIdx = list.findIndex(b => b.isDefault)
      if (defIdx > 0) setForm(f => ({ ...f, bankIndex: defIdx }))
    }).catch(() => {})
    fetch('/api/settings').then(r => r.json()).then(s => setCompany(companyFromSettings(s))).catch(() => {})
  }, [])

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
  function addService(val: string) {
    if (!val) return
    const [name, priceStr] = val.split('|')
    setForm(f => ({ ...f, items: [...f.items, { name, detail: '', qty: 1, unit: 'งาน', price: Number(priceStr) || 0 }] }))
  }

  const subtotal = form.items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = subtotal - form.discount
  const vat = form.vatEnabled ? afterDiscount * 0.07 : 0
  const grand = afterDiscount + vat
  const deposit = grand * 0.5
  const balance = grand - deposit
  const isDeposit = form.paymentTerm === 'deposit50'
  const bankList = banks.length ? banks : FALLBACK_BANKS
  const bank = bankList[form.bankIndex] || bankList[0]

  async function handleSave(status: 'draft' | 'sent', dest: 'list' | 'detail' = 'detail') {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: form.customerId || null,
          status,
          issueDate: form.issueDate,
          expiry: form.expiry && form.expiry !== '-' ? form.expiry : null,
          items: form.items,
          discount: form.discount || 0,
          vatEnabled: form.vatEnabled,
          paymentTerm: form.paymentTerm,
          bankIndex: form.bankIndex,
          clientName: form.clientName || null,
          clientAddress: form.clientAddress || null,
          clientTaxId: form.clientTaxId || null,
          clientContact: form.clientContact || null,
          clientPhone: form.clientPhone || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      router.push(dest === 'list' ? '/quotation' : `/quotation/${data.id}`)
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

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 6px' }}>
        <Link href="/quotation" style={{ color: '#9aa7b2', textDecoration: 'none' }}>ใบเสนอราคา</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500 }}>สร้างใหม่</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '0 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>สร้างใบเสนอราคา</div>
          <div style={{ fontSize: 13, color: '#9aa7b2', marginTop: 2, fontFamily: "'IBM Plex Sans', sans-serif" }}>{quoteNo}</div>
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <div onClick={() => router.push('/quotation')} style={headerBtn}>ยกเลิก</div>
          <div onClick={() => setPreviewOpen(true)} style={headerBtn}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>visibility</span>พรีวิวดูตัวอย่าง
          </div>
          <div onClick={() => handleSave('draft', 'list')} style={headerBtn}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>save</span>บันทึกร่าง
          </div>
          <div onClick={() => handleSave('sent', 'detail')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', borderRadius: 10, background: '#5f7d99', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>{saving ? 'กำลังบันทึก...' : 'บันทึกและส่ง'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* LEFT */}
        <div style={{ flex: '1.6 1 460px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* ข้อมูลทั่วไป */}
          <div style={cardStyle}>
            <div style={cardTitle}>ข้อมูลทั่วไป</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={fieldLabel}>ลูกค้า</div>
                <select value={form.customerId} onChange={e => handleCustomerChange(e.target.value)} style={qInput}>
                  <option value="">— เลือกลูกค้า —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={fieldLabel}>โปรเจกต์</div>
                <select value={form.projectId} onChange={e => setField('projectId', e.target.value)} style={qInput}>
                  <option value="">— เลือกโปรเจกต์ —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={fieldLabel}>วันที่ออก</div>
                <input value={form.issueDate} onChange={e => setField('issueDate', e.target.value)} style={qInput} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={fieldLabel}>วันหมดอายุ</div>
                <input value={form.expiry} onChange={e => setField('expiry', e.target.value)} style={qInput} />
              </div>
            </div>
          </div>

          {/* รายละเอียดลูกค้า */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 4 }}>
              รายละเอียดลูกค้า <span style={{ fontSize: 12.5, color: '#9aa7b2', fontWeight: 400 }}>(แสดงบนเอกสาร)</span>
            </div>
            <div style={{ fontSize: 12, color: '#9aa7b2', marginBottom: 16 }}>ข้อมูลส่วนนี้จะปรากฏในกล่องลูกค้าบนใบเสนอราคา</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={fieldLabel}>ผู้ติดต่อ / Attention</div>
                  <input value={form.clientContact} onChange={e => setField('clientContact', e.target.value)} placeholder="คุณ ..." style={qInput} />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={fieldLabel}>โทร / Tel</div>
                  <input value={form.clientPhone} onChange={e => setField('clientPhone', e.target.value)} placeholder="0xx-xxx-xxxx" style={qInput} />
                </div>
              </div>
              <div>
                <div style={fieldLabel}>ชื่อบริษัท / ผู้รับ</div>
                <input value={form.clientName} onChange={e => setField('clientName', e.target.value)} placeholder="ชื่อบริษัทหรือชื่อลูกค้า" style={qInput} />
              </div>
              <div>
                <div style={fieldLabel}>ที่อยู่ / Address</div>
                <input value={form.clientAddress} onChange={e => setField('clientAddress', e.target.value)} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" style={qInput} />
              </div>
              <div style={{ maxWidth: 260 }}>
                <div style={fieldLabel}>เลขประจำตัวผู้เสียภาษี</div>
                <input value={form.clientTaxId} onChange={e => setField('clientTaxId', e.target.value)} placeholder="0000000000000" style={qInput} />
              </div>
            </div>
          </div>

          {/* รายการ */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>รายการ</div>
              <select value="" onChange={e => { addService(e.target.value); e.target.value = '' }} style={{ border: '1px solid #e4e8ec', borderRadius: 9, height: 36, padding: '0 12px', fontFamily: 'inherit', fontSize: 13, color: '#5f7d99', fontWeight: 500, outline: 'none', background: '#f5f7f9', cursor: 'pointer' }}>
                <option value="">+ เพิ่มจากบริการ (ดึงราคาตั้งต้น)</option>
                {SERVICES.map(([name, price]) => <option key={name} value={`${name}|${price}`}>{name} · ฿{fmt(price)}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 66px 100px 92px 30px', gap: 9, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 2px 10px' }}>
              <div>รายการ / รายละเอียด</div>
              <div style={{ textAlign: 'center' }}>จำนวน</div>
              <div style={{ textAlign: 'center' }}>หน่วย</div>
              <div style={{ textAlign: 'right' }}>ราคา/หน่วย</div>
              <div style={{ textAlign: 'right' }}>รวม</div>
              <div />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 66px 100px 92px 30px', gap: 9, alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={it.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="ชื่อรายการ" style={qInput} />
                    <input value={it.detail} onChange={e => updateItem(idx, 'detail', e.target.value)} placeholder="รายละเอียด (ถ้ามี)" style={{ width: '100%', border: '1px solid #eef1f4', borderRadius: 9, height: 34, padding: '0 12px', fontFamily: 'inherit', fontSize: 12.5, color: '#7a8893', outline: 'none', background: '#fafbfc', boxSizing: 'border-box' }} />
                  </div>
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
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." style={{ width: '100%', minHeight: 70, border: '1px solid #e4e8ec', borderRadius: 10, padding: '11px 13px', fontFamily: 'inherit', fontSize: 13.5, color: '#5b6b77', outline: 'none', resize: 'vertical', background: '#fff', boxSizing: 'border-box', lineHeight: 1.5 }} />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ width: 320, flex: '1 1 280px', position: 'sticky', top: 6, background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>สรุปยอด</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>รวมเป็นเงิน</span>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{fmt(subtotal)}</span>
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
              <span style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{fmt(grand)}</span>
            </div>
          </div>

          {/* เงื่อนไขการชำระเงิน */}
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1.5px solid #eef1f4' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3b4954', marginBottom: 10 }}>เงื่อนไขการชำระเงิน</div>
            <div style={{ display: 'flex', gap: 9 }}>
              <div onClick={() => setField('paymentTerm', 'deposit50')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '12px 6px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${isDeposit ? '#5f7d99' : '#edf0f3'}`, background: isDeposit ? '#e8eef4' : '#fff' }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", color: isDeposit ? '#5f7d99' : '#9aa7b2' }}>50%</span>
                <span style={{ fontSize: 11.5, color: isDeposit ? '#5f7d99' : '#9aa7b2' }}>มัดจำ</span>
              </div>
              <div onClick={() => setField('paymentTerm', 'full')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '12px 6px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${!isDeposit ? '#5f7d99' : '#edf0f3'}`, background: !isDeposit ? '#e8eef4' : '#fff' }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", color: !isDeposit ? '#5f7d99' : '#9aa7b2' }}>100%</span>
                <span style={{ fontSize: 11.5, color: !isDeposit ? '#5f7d99' : '#9aa7b2' }}>ชำระเต็มจำนวน</span>
              </div>
            </div>
            {isDeposit ? (
              <div style={{ marginTop: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eef3f7', borderRadius: 10, padding: '11px 13px' }}>
                  <span style={{ fontSize: 12.5, color: '#54697d' }}>มัดจำ 50%</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#5f7d99', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{fmt(deposit)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px' }}>
                  <span style={{ fontSize: 12.5, color: '#9aa7b2' }}>คงเหลือชำระเมื่อส่งงาน</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#7a8893', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{fmt(balance)}</span>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e6f2ec', borderRadius: 10, padding: '11px 13px' }}>
                <span style={{ fontSize: 12.5, color: '#3d6a52' }}>ชำระเต็มจำนวน</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#3d8a64', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{fmt(grand)}</span>
              </div>
            )}
          </div>

          {/* hint */}
          <div style={{ background: '#eef3f7', borderRadius: 12, padding: '13px 15px', marginTop: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#5f7d99' }}>lightbulb</span>
            <span style={{ fontSize: 12, color: '#54697d', lineHeight: 1.5 }}>ยอดทั้งหมดคำนวณอัตโนมัติเมื่อแก้ไขรายการ ส่วนลด หรือเปิด VAT</span>
          </div>

          {/* บัญชีรับชำระเงิน */}
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1.5px solid #eef1f4' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3b4954', marginBottom: 9 }}>บัญชีรับชำระเงิน</div>
            <select value={form.bankIndex} onChange={e => setField('bankIndex', Number(e.target.value))} style={{ width: '100%', border: '1px solid #e4e8ec', borderRadius: 9, height: 40, padding: '0 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#2f3b45', outline: 'none', background: '#fff', boxSizing: 'border-box', marginBottom: 11 }}>
              {bankList.map((b, i) => <option key={i} value={i}>{b.bank} · {b.no}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#f5f7f9', borderRadius: 11, padding: '12px 13px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: bank.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#fff' }}>{bank.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: '#5b6b77', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bank.bank} · {bank.name}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{bank.no}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.45)', zIndex: 60, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>พรีวิวเอกสาร</span>
              <div style={{ display: 'flex', gap: 9 }}>
                <button onClick={() => printDocNode(previewRef.current, quoteNo)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, cursor: 'pointer', background: '#fff' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>picture_as_pdf</span>Export PDF
                </button>
                <button onClick={() => setPreviewOpen(false)} style={{ width: 36, height: 36, border: '1px solid #e4e8ec', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff', fontSize: 15, color: '#5b6b77' }}>✕</button>
              </div>
            </div>
            <div ref={previewRef} className="print-doc" style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '46px 48px', maxWidth: 860, margin: '0 auto' }}>
              <QuotationDoc
                no={quoteNo}
                status="draft"
                issueDate={form.issueDate}
                expiry={form.expiry && form.expiry !== '-' ? form.expiry : null}
                clientName={form.clientName}
                clientAddress={form.clientAddress}
                clientTaxId={form.clientTaxId}
                clientContact={form.clientContact}
                clientPhone={form.clientPhone}
                items={form.items.map(({ name, detail, qty, unit, price }) => ({ name, detail, qty, unit, price }))}
                discount={form.discount}
                vatEnabled={form.vatEnabled}
                paymentTerm={form.paymentTerm}
                bankIndex={form.bankIndex}
                banks={banks.map(b => ({ name: b.bank, type: '', no: b.no, holder: b.name, brand: b.brand, icon: b.icon }))}
                notes={form.notes}
                company={company}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
