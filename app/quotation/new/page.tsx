'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  id: string
  description: string
  qty: number
  unit: string
  price: number
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  border: '1px solid #e4e8ec',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 14,
  color: '#2f3b45',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  border: '1px solid #edf0f3',
  padding: 24,
}

const labelStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: '#7a8893',
  marginBottom: 6,
  display: 'block',
}

export default function NewQuotationPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [customerId, setCustomerId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expireDate, setExpireDate] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<Item[]>([
    { id: genId(), description: '', qty: 1, unit: 'งาน', price: 0 },
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(data => setCustomers(Array.isArray(data) ? data : []))
    fetch('/api/projects').then(r => r.json()).then(data => setProjects(Array.isArray(data) ? data : []))
    const today = new Date().toISOString().slice(0, 10)
    setIssueDate(today)
  }, [])

  function updateItem(id: string, key: keyof Item, value: string | number) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [key]: value } : it))
  }

  function addItem() {
    setItems(prev => [...prev, { id: genId(), description: '', qty: 1, unit: 'งาน', price: 0 }])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  const vat = subtotal * 0.07
  const total = subtotal + vat

  async function handleSubmit() {
    if (!customerId) return
    setSaving(true)
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          projectId: projectId || undefined,
          issueDate,
          expiry: expireDate || undefined,
          items: items.map(({ description, qty, unit, price }) => ({ name: description, detail: '', qty, unit, price })),
          notes: note,
          status: 'draft',
          vatEnabled: true,
          discount: 0,
        }),
      })
      const data = await res.json()
      router.push(`/quotation/${data.id}`)
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 6px' }}>
        <Link href="/quotation" style={{ color: '#9aa7b2', textDecoration: 'none' }}>ใบเสนอราคา</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500 }}>สร้างใหม่</span>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45', margin: 0 }}>สร้างใบเสนอราคา</h1>
          <div style={{ fontSize: 13, color: '#9aa7b2', marginTop: 2, fontFamily: "'IBM Plex Sans', monospace" }}>QT-XXXX-XXX</div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <Link href="/quotation" style={{
            display: 'flex', alignItems: 'center', height: 40, padding: '0 16px',
            border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77',
            fontWeight: 500, textDecoration: 'none', background: '#fff',
          }}>ยกเลิก</Link>
          <button
            onClick={handleSubmit}
            disabled={saving || !customerId}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px',
              border: 'none', borderRadius: 10, background: '#5f7d99', color: '#fff',
              fontSize: 13.5, fontWeight: 600, cursor: saving || !customerId ? 'not-allowed' : 'pointer',
              opacity: saving || !customerId ? 0.7 : 1,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check</span>
            สร้างใบเสนอราคา
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left */}
        <div style={{ flex: '1.7 1 460px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Card 1: ข้อมูลเอกสาร */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>ข้อมูลเอกสาร</div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>ลูกค้า *</label>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>โปรเจกต์</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} – {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>วันที่ออก</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>วันหมดอายุ</label>
                <input
                  type="date"
                  value={expireDate}
                  onChange={e => setExpireDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Card 2: รายการสินค้า / บริการ */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>รายการสินค้า / บริการ</div>

            {/* Column Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 84px 74px 116px 116px 36px',
              gap: 8,
              padding: '0 4px',
              marginBottom: 8,
              fontSize: 11.5,
              color: '#9aa7b2',
              fontWeight: 600,
            }}>
              <div>รายละเอียด</div>
              <div style={{ textAlign: 'center' }}>จำนวน</div>
              <div style={{ textAlign: 'center' }}>หน่วย</div>
              <div style={{ textAlign: 'right' }}>ราคา/หน่วย</div>
              <div style={{ textAlign: 'right' }}>จำนวนเงิน</div>
              <div />
            </div>

            {/* Item Rows */}
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 84px 74px 116px 116px 36px',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <input
                  value={item.description}
                  onChange={e => updateItem(item.id, 'description', e.target.value)}
                  placeholder="รายละเอียด"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.qty}
                  onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                  min={1}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
                <input
                  value={item.unit}
                  onChange={e => updateItem(item.id, 'unit', e.target.value)}
                  placeholder="งาน"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.price}
                  onChange={e => updateItem(item.id, 'price', Number(e.target.value))}
                  min={0}
                  style={{ ...inputStyle, textAlign: 'right' }}
                />
                <div style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#2f3b45',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  fontFamily: "'IBM Plex Sans', monospace",
                }}>
                  {fmt(item.qty * item.price)}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    width: 36,
                    height: 36,
                    border: '1px solid #e4e8ec',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>close</span>
                </button>
              </div>
            ))}

            {/* Add Item Button */}
            <button
              onClick={addItem}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                height: 36,
                padding: '0 14px',
                borderRadius: 9,
                background: '#f5f7f9',
                color: '#5f7d99',
                fontSize: 13.5,
                fontWeight: 500,
                cursor: 'pointer',
                border: '1.5px dashed #c9d7e3',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
              เพิ่มรายการ
            </button>
          </div>

          {/* Card 3: หมายเหตุ / เงื่อนไข */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>หมายเหตุ / เงื่อนไข</div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="เงื่อนไขการชำระเงิน ระยะเวลา ฯลฯ"
              style={{
                width: '100%',
                minHeight: 80,
                border: '1px solid #e4e8ec',
                borderRadius: 10,
                padding: '12px 14px',
                fontFamily: 'inherit',
                fontSize: 14,
                color: '#5b6b77',
                outline: 'none',
                resize: 'vertical',
                background: '#fff',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        {/* Right */}
        <div style={{ width: 330, flex: '1 1 290px', position: 'sticky', top: 6 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 4 }}>สรุปมูลค่า</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ fontSize: 14, color: '#7a8893' }}>ราคารวม</span>
              <span style={{ fontSize: 14, fontFamily: "'IBM Plex Sans', monospace", color: '#2f3b45' }}>฿{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ fontSize: 14, color: '#7a8893' }}>ภาษีมูลค่าเพิ่ม 7%</span>
              <span style={{ fontSize: 14, fontFamily: "'IBM Plex Sans', monospace", color: '#2f3b45' }}>฿{fmt(vat)}</span>
            </div>
            <div style={{ borderTop: '1.5px solid #eef1f4', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>รวมทั้งสิ้น</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(total)}</span>
            </div>

            {!customerId && (
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                background: '#fdf3e3',
                borderRadius: 10,
                fontSize: 13,
                color: '#c27a2a',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>warning</span>
                เลือกลูกค้าก่อน
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving || !customerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                width: '100%',
                height: 46,
                borderRadius: 12,
                background: '#5f7d99',
                color: '#fff',
                fontSize: 14.5,
                fontWeight: 600,
                cursor: saving || !customerId ? 'not-allowed' : 'pointer',
                marginTop: 20,
                boxShadow: '0 4px 12px rgba(95,125,153,.3)',
                border: 'none',
                opacity: saving || !customerId ? 0.7 : 1,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check</span>
              {saving ? 'กำลังบันทึก...' : 'สร้างใบเสนอราคา'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
