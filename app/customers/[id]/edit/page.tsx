'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const typeChips = [
  { key: 'new',    label: 'ลูกค้าใหม่', bg: '#e9f3ed', color: '#3d8a64', activeBorder: '#3d8a64' },
  { key: 'normal', label: 'ปกติ',      bg: '#e8eef4', color: '#5f7d99', activeBorder: '#5f7d99' },
  { key: 'vip',    label: 'VIP',       bg: '#fdf3e3', color: '#f4a431', activeBorder: '#f4a431' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e8ec', borderRadius: 10, height: 40,
  padding: '0 13px', fontFamily: 'inherit', fontSize: 14, color: '#2f3b45',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 12.5, color: '#7a8893', marginBottom: 6, display: 'block' }
const sectionStyle: React.CSSProperties = { background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }

function getInitial(name: string) { return name ? name.slice(0, 1).toUpperCase() : 'M' }

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', company: '', type: 'new' as 'new' | 'normal' | 'vip',
    contact: '', phone: '', email: '', line: '', address: '', taxId: '', notes: '',
  })

  useEffect(() => {
    if (!id) return
    fetch(`/api/customers/${id}`)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(c => {
        const data = c.customer || c
        setForm({
          name: data.name || '',
          company: data.company || '',
          type: (data.type as 'new' | 'normal' | 'vip') || 'normal',
          contact: data.contact || '',
          phone: data.phone || '',
          email: data.email || '',
          line: data.line || '',
          address: data.address || '',
          taxId: data.taxId || '',
          notes: data.notes || '',
        })
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.name || !form.phone) { alert('กรอกชื่อลูกค้าและเบอร์โทรก่อน'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push(`/customers/${id}`)
      else alert('บันทึกไม่สำเร็จ')
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
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
        <span className="material-symbols-rounded" style={{ fontSize: 48, opacity: 0.4 }}>person_off</span>
        <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบลูกค้า</div>
        <Link href="/customers" style={{ color: '#5f7d99', fontSize: 14 }}>← กลับไปรายการ</Link>
      </div>
    )
  }

  const selectedType = typeChips.find(t => t.key === form.type) || typeChips[1]

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 6px' }}>
        <Link href="/customers" style={{ color: '#9aa7b2', textDecoration: 'none' }}>ลูกค้าทั้งหมด</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <Link href={`/customers/${id}`} style={{ color: '#9aa7b2', textDecoration: 'none' }}>{form.name || 'ลูกค้า'}</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500 }}>แก้ไข</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '0 0 18px' }}>
        <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>แก้ไขข้อมูลลูกค้า</div>
        <div style={{ display: 'flex', gap: 9 }}>
          <Link href={`/customers/${id}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 16px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, cursor: 'pointer', background: '#fff' }}>
              ยกเลิก
            </div>
          </Link>
          <div
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', borderRadius: 10, background: saving ? '#9aa7b2' : '#5f7d99', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check</span>
            {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: forms */}
        <div style={{ flex: '1.7 1 460px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* ข้อมูลหลัก */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>ข้อมูลหลัก</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>ชื่อลูกค้า / แบรนด์ <span style={{ color: '#c4593f' }}>*</span></label>
                  <input style={inputStyle} placeholder="เช่น PERCARE, GLOWME" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>บริษัท / ร้านค้า</label>
                  <input style={inputStyle} placeholder="ชื่อนิติบุคคล (ถ้ามี)" value={form.company} onChange={e => set('company', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>ประเภทลูกค้า</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {typeChips.map(t => (
                    <div
                      key={t.key}
                      onClick={() => set('type', t.key)}
                      style={{ padding: '8px 16px', borderRadius: 10, border: form.type === t.key ? `2px solid ${t.activeBorder}` : '1.5px solid #edf0f3', background: form.type === t.key ? t.bg : '#f9fafb', color: form.type === t.key ? t.color : '#7a8893', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ข้อมูลติดต่อ */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>ข้อมูลติดต่อ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>ผู้ติดต่อ</label>
                  <input style={inputStyle} placeholder="คุณ ..." value={form.contact} onChange={e => set('contact', e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>เบอร์โทร <span style={{ color: '#c4593f' }}>*</span></label>
                  <input style={inputStyle} placeholder="0xx-xxx-xxxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>อีเมล</label>
                  <input style={inputStyle} type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={labelStyle}>Line ID</label>
                  <input style={inputStyle} placeholder="@lineid" value={form.line} onChange={e => set('line', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>ที่อยู่</label>
                <input style={inputStyle} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div style={{ maxWidth: 280 }}>
                <label style={labelStyle}>เลขประจำตัวผู้เสียภาษี</label>
                <input style={inputStyle} placeholder="0000000000000" value={form.taxId} onChange={e => set('taxId', e.target.value)} />
              </div>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 12 }}>หมายเหตุ</div>
            <textarea
              style={{ ...inputStyle, height: 'auto', minHeight: 80, padding: '11px 13px', resize: 'vertical', lineHeight: 1.5 }}
              placeholder="ความชอบ สไตล์ โทนสี เงื่อนไขพิเศษ ฯลฯ"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
        </div>

        {/* Right: preview */}
        <div style={{ width: 330, flex: '1 1 290px', position: 'sticky', top: 6, background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>ตัวอย่างการ์ดลูกค้า</div>
          <div style={{ border: '1px solid #edf0f3', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#54697d', fontSize: 16, background: 'linear-gradient(135deg,#eef2f6,#dde6ee)', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {getInitial(form.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: '#2f3b45' }}>{form.name || 'ชื่อลูกค้า'}</div>
                <div style={{ fontSize: 12.5, color: '#9aa7b2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.company || '—'}</div>
              </div>
              <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, background: selectedType.bg, color: selectedType.color }}>{selectedType.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#7a8893', marginTop: 14 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#a9b6c0' }}>call</span>
              {form.phone || '—'}
            </div>
          </div>
          <div
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 46, borderRadius: 12, background: '#5f7d99', color: '#fff', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', marginTop: 20, boxShadow: '0 4px 12px rgba(95,125,153,.3)' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>save</span>
            บันทึกการแก้ไข
          </div>
          {(!form.name || !form.phone) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, fontSize: 12, color: '#a9762f' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>info</span>
              กรอกชื่อลูกค้าและเบอร์โทรก่อน
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
