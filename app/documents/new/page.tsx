'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  company?: string
  phone?: string
  email?: string
  address?: string
  taxId?: string
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

interface Item {
  name: string
  detail: string
  qty: number
  unit: string
  price: number
}

const typeConfig = {
  invoice: { label: 'ใบแจ้งหนี้', labelEn: 'INVOICE', icon: 'receipt_long' },
  receipt: { label: 'ใบเสร็จรับเงิน', labelEn: 'RECEIPT', icon: 'check_circle' },
  taxinvoice: { label: 'ใบกำกับภาษี', labelEn: 'TAX INVOICE', icon: 'gavel' },
}

const PAY_METHODS = ['โอนเงิน', 'เงินสด', 'เช็ค', 'บัตรเครดิต']
const BANKS = [
  { name: 'ธ.กสิกรไทย (KBank)' },
  { name: 'ธ.ไทยพาณิชย์ (SCB)' },
  { name: 'ธ.กรุงเทพ (BBL)' },
  { name: 'พร้อมเพย์' },
]

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcSummary(items: Item[], discount: number, vatEnabled: boolean) {
  const sub = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = sub - discount
  const vat = vatEnabled ? afterDiscount * 0.07 : 0
  return { sub, vat, total: afterDiscount + vat }
}

function NewDocumentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const docType = (searchParams.get('type') || 'invoice') as 'invoice' | 'receipt' | 'taxinvoice'
  const cfg = typeConfig[docType] || typeConfig.invoice

  const [customers, setCustomers] = useState<Customer[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [saving, setSaving] = useState(false)

  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })

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
    delivery: '',
    clientName: '',
    clientAddress: '',
    clientTaxId: '',
    clientContact: '',
    clientPhone: '',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(data => setCustomers(Array.isArray(data) ? data : []))
    fetch('/api/quotations').then(r => r.json()).then(data => setQuotations(Array.isArray(data) ? data : []))
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

  function handleQuotationChange(id: string) {
    const q = quotations.find(q => q.id === id)
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

  const { sub, vat, total } = calcSummary(form.items, form.discount, form.vatEnabled)

  async function handleSave(status: 'draft' | 'sent', dest: 'list' | 'detail' = 'detail') {
    setSaving(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: docType, status }),
      })
      const data = await res.json()
      router.push(dest === 'list' ? '/documents' : `/documents/${data.id}`)
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setSaving(false)
    }
  }

  const cardStyle = { background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22, marginBottom: 16 }
  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e0e5ea', borderRadius: 10, fontSize: 14, color: '#2f3b45', background: '#fff', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: '#7a8893', display: 'block' as const, marginBottom: 5 }

  const refQuotation = quotations.find(q => q.id === form.quotationId)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>สร้าง{cfg.label}</h1>
          <p style={{ fontSize: 14, color: '#7a8893', margin: '4px 0 0' }}>{cfg.labelEn}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/documents')}
            style={{ background: '#f0f2f5', color: '#5f7d99', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            ยกเลิก
          </button>
          <button
            onClick={() => handleSave('draft', 'detail')}
            disabled={saving}
            style={{ background: '#e8f1f9', color: '#6b96c2', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>visibility</span>
            ดูตัวอย่าง
          </button>
          <button
            onClick={() => handleSave('draft', 'list')}
            disabled={saving}
            style={{ background: '#edf0f3', color: '#5f7d99', border: '1px solid #d0d8e0', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            บันทึกร่าง
          </button>
          <button
            onClick={() => handleSave('sent', 'detail')}
            disabled={saving}
            style={{ background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>
            บันทึกและส่ง
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Left column */}
        <div style={{ flex: '1.7', minWidth: 0 }}>

          {/* ข้อมูลทั่วไป */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 16px' }}>ข้อมูลทั่วไป</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>ลูกค้า</label>
                <select value={form.customerId} onChange={e => handleCustomerChange(e.target.value)} style={inputStyle}>
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice: ref quotation */}
              {docType === 'invoice' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>อ้างอิงใบเสนอราคา (ถ้ามี)</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <select value={form.quotationId} onChange={e => handleQuotationChange(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      <option value="">-- เลือกใบเสนอราคา --</option>
                      {quotations.map(q => (
                        <option key={q.id} value={q.id}>{q.no} — {q.clientName || '—'}</option>
                      ))}
                    </select>
                    {refQuotation && (
                      <Link href={`/quotation/${form.quotationId}`} target="_blank" style={{ color: '#5f7d99', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>open_in_new</span>
                        {refQuotation.no}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Receipt: ref invoice */}
              {docType === 'receipt' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>อ้างอิงใบแจ้งหนี้</label>
                  <input value={form.refInvoiceId} onChange={e => setField('refInvoiceId', e.target.value)} style={inputStyle} placeholder="เลขที่ใบแจ้งหนี้" />
                </div>
              )}

              {/* Tax Invoice: ref invoice */}
              {docType === 'taxinvoice' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>อ้างอิงใบแจ้งหนี้</label>
                  <input value={form.refInvoiceId} onChange={e => setField('refInvoiceId', e.target.value)} style={inputStyle} placeholder="เลขที่ใบแจ้งหนี้" />
                </div>
              )}

              <div>
                <label style={labelStyle}>วันที่ออก</label>
                <input value={form.issueDate} onChange={e => setField('issueDate', e.target.value)} style={inputStyle} placeholder="วว/ดด/ปปปป" />
              </div>
              {docType !== 'receipt' && (
                <div>
                  <label style={labelStyle}>วันครบกำหนด</label>
                  <input value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} style={inputStyle} placeholder="วว/ดด/ปปปป" />
                </div>
              )}
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
                <textarea value={form.clientAddress} onChange={e => setField('clientAddress', e.target.value)} style={{ ...inputStyle, height: 72, resize: 'vertical' }} placeholder="ที่อยู่" />
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
              <button
                onClick={addItem}
                style={{ background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
                เพิ่มรายการ
              </button>
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
                        <input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} style={{ ...inputStyle, padding: '7px 10px' }} placeholder="ชื่อรายการ" />
                      </td>
                      <td style={{ padding: '8px 10px', minWidth: 140 }}>
                        <input value={item.detail} onChange={e => updateItem(idx, 'detail', e.target.value)} style={{ ...inputStyle, padding: '7px 10px' }} placeholder="รายละเอียด" />
                      </td>
                      <td style={{ padding: '8px 10px', width: 70 }}>
                        <input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} style={{ ...inputStyle, padding: '7px 10px', textAlign: 'center' }} min={1} />
                      </td>
                      <td style={{ padding: '8px 10px', width: 80 }}>
                        <input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} style={{ ...inputStyle, padding: '7px 10px' }} />
                      </td>
                      <td style={{ padding: '8px 10px', width: 120 }}>
                        <input type="number" value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} style={{ ...inputStyle, padding: '7px 10px', textAlign: 'right' }} min={0} />
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontSize: 14, whiteSpace: 'nowrap' }}>
                        ฿{fmt(item.qty * item.price)}
                      </td>
                      <td style={{ padding: '8px 10px', width: 36 }}>
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e07b54', padding: 4 }}>
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

          {/* Receipt: Payment section */}
          {docType === 'receipt' && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 16px' }}>ข้อมูลการชำระเงิน</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>วิธีชำระเงิน</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PAY_METHODS.map(m => (
                      <button
                        key={m}
                        onClick={() => setField('payMethod', m)}
                        style={{
                          padding: '7px 14px', border: `2px solid ${form.payMethod === m ? '#5f7d99' : '#edf0f3'}`,
                          borderRadius: 10, background: form.payMethod === m ? '#e8eef4' : '#fff',
                          color: form.payMethod === m ? '#5f7d99' : '#7a8893', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >{m}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>วันที่รับชำระ</label>
                  <input value={form.payDate} onChange={e => setField('payDate', e.target.value)} style={inputStyle} placeholder="วว/ดด/ปปปป" />
                </div>
                <div>
                  <label style={labelStyle}>เลขอ้างอิง / เลขโอน</label>
                  <input value={form.payRef} onChange={e => setField('payRef', e.target.value)} style={inputStyle} placeholder="xxxxxx" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>อัปโหลด Slip (URL)</label>
                  <input value={form.delivery} onChange={e => setField('delivery', e.target.value)} style={inputStyle} placeholder="https://..." />
                </div>
              </div>
            </div>
          )}

          {/* Tax Invoice: Delivery tracking */}
          {docType === 'taxinvoice' && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 16px' }}>ข้อมูลการจัดส่ง</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>ขนส่ง</label>
                  <input value={form.delivery} onChange={e => setField('delivery', e.target.value)} style={inputStyle} placeholder="Kerry / Flash / ไปรษณีย์" />
                </div>
                <div>
                  <label style={labelStyle}>เลข Tracking</label>
                  <input value={form.payRef} onChange={e => setField('payRef', e.target.value)} style={inputStyle} placeholder="TH000000000000" />
                </div>
                <div>
                  <label style={labelStyle}>วันที่ส่ง</label>
                  <input value={form.payDate} onChange={e => setField('payDate', e.target.value)} style={inputStyle} placeholder="วว/ดด/ปปปป" />
                </div>
              </div>
            </div>
          )}

          {/* หมายเหตุ */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 12px' }}>หมายเหตุ</h3>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} style={{ ...inputStyle, height: 90, resize: 'vertical' }} placeholder="หมายเหตุเพิ่มเติม..." />
          </div>
        </div>

        {/* Right column */}
        <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 0 }}>

          {/* สรุปยอด */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 16px' }}>สรุปยอด</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#7a8893' }}>
                <span>มูลค่ารวม</span><span>฿{fmt(sub)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#7a8893' }}>
                <span>ส่วนลด</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>฿</span>
                  <input type="number" value={form.discount} onChange={e => setField('discount', Number(e.target.value))} style={{ ...inputStyle, width: 110, padding: '5px 8px', textAlign: 'right' }} min={0} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#7a8893' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.vatEnabled} onChange={e => setField('vatEnabled', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
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

          {/* Bank (not for taxinvoice receipt) */}
          {docType === 'invoice' && (
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
          )}

          {/* Type indicator */}
          <div style={{ ...cardStyle, background: '#f9fafb', border: '1px dashed #d0d8e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 28, color: '#5f7d99' }}>{cfg.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45' }}>{cfg.label}</div>
                <div style={{ fontSize: 12, color: '#9aa7b2' }}>{cfg.labelEn}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
