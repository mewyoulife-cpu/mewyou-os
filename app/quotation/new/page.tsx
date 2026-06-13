'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  name: string
  company?: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
}

interface Item {
  name: string
  detail: string
  qty: number
  unit: string
  price: number
}

const PRESET_SERVICES = [
  { name: 'Logo Design', price: 8000 },
  { name: 'Packaging Design', price: 15000 },
  { name: 'Label Design', price: 5000 },
  { name: 'Mockup', price: 12000 },
  { name: 'Box Design', price: 18000 },
]

const BANKS = [
  { name: 'ธ.กสิกรไทย (KBank)', short: 'KBank' },
  { name: 'ธ.ไทยพาณิชย์ (SCB)', short: 'SCB' },
  { name: 'ธ.กรุงเทพ (BBL)', short: 'BBL' },
  { name: 'พร้อมเพย์', short: 'PromptPay' },
]

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcSummary(items: Item[], discount: number, vatEnabled: boolean) {
  const sub = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = sub - discount
  const vat = vatEnabled ? afterDiscount * 0.07 : 0
  const total = afterDiscount + vat
  return { sub, afterDiscount, vat, total }
}

export default function NewQuotationPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [addServiceOpen, setAddServiceOpen] = useState(false)
  const serviceRef = useRef<HTMLDivElement>(null)

  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const [form, setForm] = useState({
    customerId: '',
    issueDate: today,
    expiry: '',
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
    fetch('/api/customers').then(r => r.json()).then(data => setCustomers(Array.isArray(data) ? data : []))
  }, [])

  // Close service dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (serviceRef.current && !serviceRef.current.contains(e.target as Node)) {
        setAddServiceOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function setField(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleCustomerChange(id: string) {
    const c = customers.find(c => c.id === id)
    setForm(f => ({
      ...f,
      customerId: id,
      clientName: c?.company || c?.name || '',
      clientAddress: c?.address || '',
      clientTaxId: c?.taxId || '',
      clientContact: c?.name || '',
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
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  function addPresetService(svc: { name: string; price: number }) {
    setForm(f => ({ ...f, items: [...f.items, { name: svc.name, detail: '', qty: 1, unit: 'งาน', price: svc.price }] }))
    setAddServiceOpen(false)
  }

  const { sub, afterDiscount, vat, total } = calcSummary(form.items, form.discount, form.vatEnabled)
  const deposit = total * 0.5
  const remaining = total * 0.5

  async function handleSave(status: 'draft' | 'sent') {
    setSaving(true)
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status }),
      })
      const data = await res.json()
      router.push(`/quotation/${data.id}`)
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setSaving(false)
    }
  }

  const cardStyle = {
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #edf0f3',
    padding: 22,
    marginBottom: 16,
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #e0e5ea',
    borderRadius: 10,
    fontSize: 14,
    color: '#2f3b45',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  }

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: '#7a8893',
    display: 'block',
    marginBottom: 5,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>สร้างใบเสนอราคา</h1>
          <p style={{ fontSize: 14, color: '#7a8893', margin: '4px 0 0' }}>กรอกข้อมูลเพื่อสร้างใบเสนอราคาใหม่</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/quotation')}
            style={{ background: '#f0f2f5', color: '#5f7d99', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            ยกเลิก
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            style={{ background: '#edf0f3', color: '#5f7d99', border: '1px solid #d0d8e0', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            บันทึกร่าง
          </button>
          <button
            onClick={() => setPreviewOpen(true)}
            style={{ background: '#e8f1f9', color: '#6b96c2', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>preview</span>
            ดูตัวอย่าง
          </button>
          <button
            onClick={() => handleSave('sent')}
            disabled={saving}
            style={{ background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>
            บันทึกและส่ง
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Left column */}
        <div style={{ flex: '1.7', minWidth: 0 }}>

          {/* ข้อมูลทั่วไป */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 16px' }}>ข้อมูลทั่วไป</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>ลูกค้า</label>
                <select
                  value={form.customerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>วันที่ออก</label>
                <input type="text" value={form.issueDate} onChange={e => setField('issueDate', e.target.value)} style={inputStyle} placeholder="วว/ดด/ปปปป" />
              </div>
              <div>
                <label style={labelStyle}>วันหมดอายุ</label>
                <input type="text" value={form.expiry} onChange={e => setField('expiry', e.target.value)} style={inputStyle} placeholder="วว/ดด/ปปปป" />
              </div>
            </div>
          </div>

          {/* รายละเอียดลูกค้า */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 16px' }}>
              รายละเอียดลูกค้า
              <span style={{ fontSize: 12, fontWeight: 400, color: '#9aa7b2', marginLeft: 8 }}>(แสดงบนเอกสาร)</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>ผู้ติดต่อ</label>
                <input value={form.clientContact} onChange={e => setField('clientContact', e.target.value)} style={inputStyle} placeholder="ชื่อผู้ติดต่อ" />
              </div>
              <div>
                <label style={labelStyle}>เบอร์โทร</label>
                <input value={form.clientPhone} onChange={e => setField('clientPhone', e.target.value)} style={inputStyle} placeholder="เบอร์โทรศัพท์" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>ชื่อบริษัท / ผู้รับ</label>
                <input value={form.clientName} onChange={e => setField('clientName', e.target.value)} style={inputStyle} placeholder="ชื่อบริษัทหรือชื่อลูกค้า" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>ที่อยู่</label>
                <textarea
                  value={form.clientAddress}
                  onChange={e => setField('clientAddress', e.target.value)}
                  style={{ ...inputStyle, height: 72, resize: 'vertical' }}
                  placeholder="ที่อยู่"
                />
              </div>
              <div>
                <label style={labelStyle}>เลขผู้เสียภาษี</label>
                <input value={form.clientTaxId} onChange={e => setField('clientTaxId', e.target.value)} style={inputStyle} placeholder="0000000000000" />
              </div>
            </div>
          </div>

          {/* รายการ */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: 0 }}>รายการ</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative' }} ref={serviceRef}>
                  <button
                    onClick={() => setAddServiceOpen(v => !v)}
                    style={{ background: '#f0f2f5', color: '#5f7d99', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
                    เพิ่มจากบริการ
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_drop_down</span>
                  </button>
                  {addServiceOpen && (
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100,
                      background: '#fff', borderRadius: 12, border: '1px solid #edf0f3',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden',
                    }}>
                      {PRESET_SERVICES.map(svc => (
                        <button
                          key={svc.name}
                          onClick={() => addPresetService(svc)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            width: '100%', background: 'none', border: 'none', padding: '10px 16px',
                            fontSize: 13, color: '#2f3b45', cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f5f7f9'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
                        >
                          <span>{svc.name}</span>
                          <span style={{ color: '#5f7d99', fontWeight: 600 }}>฿{svc.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={addItem}
                  style={{ background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
                  เพิ่มรายการ
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #edf0f3' }}>
                    {['ชื่อรายการ', 'รายละเอียด', 'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวม', ''].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === 'รวม' ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: '#9aa7b2' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f5f7f9' }}>
                      <td style={{ padding: '8px 10px', minWidth: 140 }}>
                        <input
                          value={item.name}
                          onChange={e => updateItem(idx, 'name', e.target.value)}
                          style={{ ...inputStyle, padding: '7px 10px' }}
                          placeholder="ชื่อรายการ"
                        />
                      </td>
                      <td style={{ padding: '8px 10px', minWidth: 140 }}>
                        <input
                          value={item.detail}
                          onChange={e => updateItem(idx, 'detail', e.target.value)}
                          style={{ ...inputStyle, padding: '7px 10px' }}
                          placeholder="รายละเอียด"
                        />
                      </td>
                      <td style={{ padding: '8px 10px', width: 70 }}>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                          style={{ ...inputStyle, padding: '7px 10px', textAlign: 'center' }}
                          min={1}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', width: 80 }}>
                        <input
                          value={item.unit}
                          onChange={e => updateItem(idx, 'unit', e.target.value)}
                          style={{ ...inputStyle, padding: '7px 10px' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', width: 120 }}>
                        <input
                          type="number"
                          value={item.price}
                          onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                          style={{ ...inputStyle, padding: '7px 10px', textAlign: 'right' }}
                          min={0}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontSize: 14, whiteSpace: 'nowrap' }}>
                        ฿{fmt(item.qty * item.price)}
                      </td>
                      <td style={{ padding: '8px 10px', width: 36 }}>
                        {form.items.length > 1 && (
                          <button
                            onClick={() => removeItem(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e07b54', padding: 4 }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 12px' }}>หมายเหตุ</h3>
            <textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              style={{ ...inputStyle, height: 90, resize: 'vertical' }}
              placeholder="หมายเหตุเพิ่มเติม..."
            />
          </div>
        </div>

        {/* Right column */}
        <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 0 }}>

          {/* สรุปยอด */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 16px' }}>สรุปยอด</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#7a8893' }}>
                <span>มูลค่ารวม</span>
                <span>฿{fmt(sub)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#7a8893' }}>
                <span>ส่วนลด</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>฿</span>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={e => setField('discount', Number(e.target.value))}
                    style={{ ...inputStyle, width: 110, padding: '5px 8px', textAlign: 'right' }}
                    min={0}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#7a8893' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.vatEnabled}
                    onChange={e => setField('vatEnabled', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  VAT 7%
                </label>
                <span>{form.vatEnabled ? `฿${fmt(vat)}` : '—'}</span>
              </div>
              <div style={{ height: 1, background: '#edf0f3' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: '#2f3b45' }}>
                <span>รวมทั้งสิ้น</span>
                <span style={{ color: '#5f7d99' }}>฿{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* เงื่อนไขการชำระเงิน */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 14px' }}>เงื่อนไขการชำระเงิน</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { value: 'deposit50', label: 'มัดจำ 50%' },
                { value: 'full', label: 'ชำระเต็มจำนวน 100%' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setField('paymentTerm', opt.value)}
                  style={{
                    flex: 1, padding: '8px 6px', border: `2px solid ${form.paymentTerm === opt.value ? '#5f7d99' : '#edf0f3'}`,
                    borderRadius: 10, background: form.paymentTerm === opt.value ? '#e8eef4' : '#fff',
                    color: form.paymentTerm === opt.value ? '#5f7d99' : '#7a8893',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' as const,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.paymentTerm === 'deposit50' && (
              <div style={{ background: '#f5f7f9', borderRadius: 10, padding: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7a8893', marginBottom: 6 }}>
                  <span>ยอดมัดจำ (50%)</span>
                  <span style={{ fontWeight: 600, color: '#2f3b45' }}>฿{fmt(deposit)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7a8893' }}>
                  <span>ยอดคงเหลือ</span>
                  <span style={{ fontWeight: 600, color: '#2f3b45' }}>฿{fmt(remaining)}</span>
                </div>
              </div>
            )}
          </div>

          {/* บัญชีรับชำระ */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 12px' }}>บัญชีรับชำระเงิน</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BANKS.map((bank, idx) => (
                <button
                  key={idx}
                  onClick={() => setField('bankIndex', idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    border: `2px solid ${form.bankIndex === idx ? '#5f7d99' : '#edf0f3'}`,
                    borderRadius: 10, background: form.bankIndex === idx ? '#e8eef4' : '#fff',
                    cursor: 'pointer', textAlign: 'left' as const, width: '100%',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: form.bankIndex === idx ? '#5f7d99' : '#b0bdc8' }}>account_balance</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: form.bankIndex === idx ? '#5f7d99' : '#4a5a67' }}>{bank.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto', padding: '40px 20px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setPreviewOpen(false) }}
        >
          <div style={{ background: '#f0f2f5', borderRadius: 20, padding: 20, width: '100%', maxWidth: 880, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>ตัวอย่างใบเสนอราคา</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                style={{ background: '#fff', border: '1px solid #edf0f3', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <QuotationDocument form={form} total={total} sub={sub} vat={vat} />
          </div>
        </div>
      )}
    </div>
  )
}

function QuotationDocument({ form, total, sub, vat }: {
  form: {
    clientName: string; clientAddress: string; clientTaxId: string; clientContact: string;
    clientPhone: string; issueDate: string; expiry: string; items: Item[];
    discount: number; vatEnabled: boolean; paymentTerm: string; bankIndex: number; notes: string;
  },
  total: number; sub: number; vat: number;
}) {
  const BANKS = ['ธ.กสิกรไทย (KBank)', 'ธ.ไทยพาณิชย์ (SCB)', 'ธ.กรุงเทพ (BBL)', 'พร้อมเพย์']
  const afterDiscount = sub - form.discount

  function fmt(n: number) {
    return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '40px 48px', maxWidth: 800, margin: '0 auto',
      boxShadow: '0 4px 32px rgba(0,0,0,0.12)', fontSize: 13, color: '#1a2630',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #edf0f3' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#5f7d99', letterSpacing: '-0.5px' }}>mew.you</div>
          <div style={{ fontSize: 11, color: '#9aa7b2', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Design Studio</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2f3b45' }}>ใบเสนอราคา</div>
          <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 2 }}>QUOTATION</div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#4a5a67' }}>
            <div>วันที่: {form.issueDate}</div>
            {form.expiry && <div>ใช้ได้ถึง: {form.expiry}</div>}
          </div>
        </div>
      </div>

      {/* Client + Issuer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #edf0f3' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>เรียน</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#2f3b45' }}>{form.clientName || '(ชื่อลูกค้า)'}</div>
          {form.clientAddress && <div style={{ color: '#7a8893', marginTop: 4, lineHeight: 1.6 }}>{form.clientAddress}</div>}
          {form.clientContact && <div style={{ marginTop: 6, color: '#4a5a67' }}>ผู้ติดต่อ: {form.clientContact}</div>}
          {form.clientPhone && <div style={{ color: '#4a5a67' }}>โทร: {form.clientPhone}</div>}
          {form.clientTaxId && <div style={{ color: '#4a5a67' }}>เลขภาษี: {form.clientTaxId}</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>ผู้เสนอราคา</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#2f3b45' }}>mew.you Design Studio</div>
          <div style={{ color: '#7a8893', marginTop: 4, lineHeight: 1.6 }}>123 ถ.สุขุมวิท แขวงคลองเตย<br />กรุงเทพมหานคร 10110</div>
          <div style={{ marginTop: 6, color: '#4a5a67' }}>โทร: 02-xxx-xxxx</div>
          <div style={{ color: '#4a5a67' }}>Email: mewyou@gmail.com</div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f5f7f9' }}>
            {['#', 'รายการ', 'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'จำนวนเงิน'].map((h, i) => (
              <th key={h} style={{
                padding: '10px 12px',
                textAlign: i === 0 ? 'center' : i >= 4 ? 'right' : 'left',
                fontSize: 12, fontWeight: 700, color: '#7a8893',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {form.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f0f2f5' }}>
              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#9aa7b2', fontSize: 13 }}>{idx + 1}</td>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 600, color: '#2f3b45' }}>{item.name || '(ชื่อรายการ)'}</div>
                {item.detail && <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 2 }}>{item.detail}</div>}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4a5a67' }}>{item.qty}</td>
              <td style={{ padding: '10px 12px', color: '#4a5a67' }}>{item.unit}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4a5a67' }}>฿{fmt(item.price)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#2f3b45' }}>฿{fmt(item.qty * item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <div style={{ width: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#7a8893' }}>
            <span>มูลค่าไม่รวมภาษี</span><span>฿{fmt(sub)}</span>
          </div>
          {form.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#7a8893' }}>
              <span>ส่วนลด</span><span>-฿{fmt(form.discount)}</span>
            </div>
          )}
          {form.vatEnabled && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#7a8893' }}>
              <span>ภาษีมูลค่าเพิ่ม 7%</span><span>฿{fmt(vat)}</span>
            </div>
          )}
          <div style={{ height: 1, background: '#2f3b45', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 800, color: '#2f3b45' }}>
            <span>รวมทั้งสิ้น</span><span>฿{fmt(total)}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9aa7b2', textAlign: 'right' }}>
            ({Math.round(total)} บาทถ้วน)
          </div>
        </div>
      </div>

      {/* Payment + Conditions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40, padding: '20px 0', borderTop: '1px solid #edf0f3', borderBottom: '1px solid #edf0f3' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', marginBottom: 10 }}>ชำระเงินผ่าน</div>
          <div style={{ fontWeight: 600, color: '#2f3b45' }}>{BANKS[form.bankIndex]}</div>
          <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 4 }}>บัญชีเลขที่: XXX-X-XXXXX-X</div>
          <div style={{ fontSize: 12, color: '#9aa7b2' }}>ชื่อบัญชี: บจก. มิวยู ดีไซน์</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', marginBottom: 10 }}>เงื่อนไข</div>
          <div style={{ fontSize: 12, color: '#4a5a67', lineHeight: 1.8 }}>
            {form.paymentTerm === 'deposit50' ? (
              <>
                <div>1. มัดจำ 50% ก่อนเริ่มงาน</div>
                <div>2. ส่งงานภายใน 30 วันทำการ</div>
              </>
            ) : (
              <div>1. ชำระเต็มจำนวนก่อนรับงาน</div>
            )}
            <div>{form.paymentTerm === 'deposit50' ? '3.' : '2.'} แก้ไขได้ 2 ครั้ง</div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {['ผู้เสนอราคา', 'ผู้รับเอกสาร'].map(role => (
          <div key={role} style={{ textAlign: 'center' }}>
            <div style={{ height: 56, borderBottom: '1px solid #2f3b45', marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45' }}>{role}</div>
            <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 4 }}>วันที่: ___/___/______</div>
          </div>
        ))}
      </div>

      {form.notes && (
        <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 10, fontSize: 13, color: '#7a8893' }}>
          <span style={{ fontWeight: 600, color: '#2f3b45' }}>หมายเหตุ: </span>{form.notes}
        </div>
      )}
    </div>
  )
}
