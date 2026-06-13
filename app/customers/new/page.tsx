'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const typeMap = {
  new: { label: 'ลูกค้าใหม่', bg: '#e9f3ed', color: '#3d8a64' },
  normal: { label: 'ปกติ', bg: '#e8eef4', color: '#5f7d99' },
  vip: { label: 'VIP', bg: '#fdf3e3', color: '#f4a431' },
}

const gradients: Record<string, string> = {
  A: 'linear-gradient(135deg, #5f7d99, #3d5a73)',
  B: 'linear-gradient(135deg, #3d8a64, #2a6347)',
  C: 'linear-gradient(135deg, #f4a431, #d4841a)',
  D: 'linear-gradient(135deg, #7c6fab, #5c4f8b)',
  E: 'linear-gradient(135deg, #c4593f, #a03a25)',
}

function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : 'ลค'
}

function getGradient(name: string) {
  if (!name) return gradients.A
  const keys = Object.keys(gradients)
  return gradients[keys[name.charCodeAt(0) % keys.length]]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #edf0f3',
  borderRadius: 10,
  fontSize: 14,
  color: '#2f3b45',
  background: '#f9fafb',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "inherit",
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#2f3b45',
  marginBottom: 6,
  display: 'block',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  border: '1px solid #edf0f3',
  padding: 22,
  marginBottom: 16,
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    company: '',
    type: 'new' as 'new' | 'normal' | 'vip',
    contact: '',
    phone: '',
    email: '',
    lineId: '',
    address: '',
    taxId: '',
    notes: '',
  })

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.name || !form.phone) {
      alert('กรุณากรอกชื่อลูกค้าและเบอร์โทร')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        router.push('/customers')
      } else {
        alert('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง')
      }
    } catch {
      alert('เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const preview = typeMap[form.type]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Link href="/customers" style={{ color: '#7a8893', textDecoration: 'none', fontSize: 13 }}>ลูกค้าทั้งหมด</Link>
          <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>chevron_right</span>
          <span style={{ fontSize: 13, color: '#2f3b45' }}>เพิ่มลูกค้าใหม่</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>เพิ่มลูกค้าใหม่</h1>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ข้อมูลหลัก */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', margin: '0 0 18px' }}>ข้อมูลหลัก</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>ชื่อลูกค้า / แบรนด์ <span style={{ color: '#c4593f' }}>*</span></label>
                <input style={inputStyle} placeholder="เช่น LUXE Brand" value={form.name} onChange={e => handleChange('name', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>บริษัท / ร้านค้า</label>
                <input style={inputStyle} placeholder="เช่น บจก. ลักซ์ คอร์ปอเรชั่น" value={form.company} onChange={e => handleChange('company', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>ประเภทลูกค้า</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(Object.entries(typeMap) as [string, { label: string; bg: string; color: string }][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => handleChange('type', key)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: form.type === key ? `2px solid ${val.color}` : '1.5px solid #edf0f3',
                        background: form.type === key ? val.bg : '#f9fafb',
                        color: form.type === key ? val.color : '#7a8893',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', margin: '0 0 18px' }}>ข้อมูลติดต่อ</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>ผู้ติดต่อ</label>
                <input style={inputStyle} placeholder="ชื่อผู้ติดต่อ" value={form.contact} onChange={e => handleChange('contact', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>เบอร์โทร <span style={{ color: '#c4593f' }}>*</span></label>
                <input style={inputStyle} placeholder="0XX-XXX-XXXX" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>อีเมล</label>
                <input style={inputStyle} type="email" placeholder="example@email.com" value={form.email} onChange={e => handleChange('email', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Line ID</label>
                <input style={inputStyle} placeholder="@lineid" value={form.lineId} onChange={e => handleChange('lineId', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>ที่อยู่</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  placeholder="ที่อยู่สำหรับออกใบกำกับภาษี"
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>เลขผู้เสียภาษี</label>
                <input style={inputStyle} placeholder="0-0000-00000-00-0" value={form.taxId} onChange={e => handleChange('taxId', e.target.value)} />
              </div>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', margin: '0 0 18px' }}>หมายเหตุ</h2>
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              placeholder="บันทึกเพิ่มเติมเกี่ยวกับลูกค้า..."
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Link href="/customers" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '11px 22px',
                border: '1px solid #edf0f3',
                borderRadius: 10,
                background: '#fff',
                color: '#7a8893',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                ยกเลิก
              </button>
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '11px 22px',
                border: 'none',
                borderRadius: 10,
                background: saving ? '#9aa7b2' : '#5f7d99',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{saving ? 'hourglass_empty' : 'save'}</span>
              {saving ? 'กำลังบันทึก...' : 'บันทึกลูกค้า'}
            </button>
          </div>
        </div>

        {/* Right column - Preview */}
        <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 0 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#7a8893', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ตัวอย่างการ์ดลูกค้า
            </h3>

            {/* Preview card */}
            <div style={{
              background: '#f9fafb',
              borderRadius: 14,
              border: '1px solid #edf0f3',
              padding: 16,
            }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: getGradient(form.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
                }}>
                  {getInitials(form.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#2f3b45' }}>
                      {form.name || 'ชื่อลูกค้า'}
                    </span>
                    <span style={{
                      background: preview.bg, color: preview.color,
                      borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600,
                    }}>
                      {preview.label}
                    </span>
                  </div>
                  {form.company && (
                    <div style={{ fontSize: 12, color: '#7a8893', marginTop: 2 }}>{form.company}</div>
                  )}
                </div>
              </div>

              {/* Logo placeholder */}
              <div style={{
                height: 44,
                border: '1.5px dashed #d0d8e0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b0bdc8',
                fontSize: 11,
                marginBottom: 10,
                background: '#fff',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, marginRight: 4 }}>image</span>
                โลโก้
              </div>

              {/* Contact */}
              {form.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7a8893', marginBottom: 4 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>call</span>
                  {form.phone}
                </div>
              )}
              {form.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7a8893' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>mail</span>
                  {form.email}
                </div>
              )}
              {!form.phone && !form.email && (
                <div style={{ fontSize: 12, color: '#b0bdc8' }}>ยังไม่มีข้อมูลติดต่อ</div>
              )}
            </div>

            {/* Hint */}
            <p style={{ fontSize: 12, color: '#9aa7b2', margin: '12px 0 0', lineHeight: 1.5 }}>
              ตัวอย่างนี้จะอัปเดตตามข้อมูลที่กรอก
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
