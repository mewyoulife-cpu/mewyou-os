'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  lead: { label: 'Lead', bg: '#eef2f5', color: '#8fa7bc' },
  brief: { label: 'Brief', bg: '#e8f1f9', color: '#6b96c2' },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd' },
  payment: { label: 'Payment', bg: '#fdf3e3', color: '#f4a431' },
  design: { label: 'Design', bg: '#e8eef4', color: '#5f7d99' },
  revision: { label: 'Revision', bg: '#fceee8', color: '#e07b54' },
  approved: { label: 'Approved', bg: '#e9f3ed', color: '#3d8a64' },
  deliver: { label: 'Deliver', bg: '#e3f2fd', color: '#2196f3' },
  completed: { label: 'Completed', bg: '#e8f5e9', color: '#4caf50' },
}

const JOB_TYPES = ['Logo', 'Packaging Design', 'Label Design', 'Sticker', 'Box Design', 'Brochure', 'Mockup', 'Artwork']
const STATUSES = Object.keys(STATUS_MAP)

type Customer = { id: string; name: string; company?: string }

function fmt(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 10,
  border: '1px solid #dde3e9',
  padding: '0 12px',
  fontSize: 14,
  color: '#2f3b45',
  background: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#7a8893',
  marginBottom: 6,
  display: 'block',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  border: '1px solid #edf0f3',
  padding: '20px 22px',
  marginBottom: 16,
}

export default function NewProjectPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    customerId: '',
    assignee: '',
    types: [] as string[],
    status: 'lead',
    startDate: '',
    dueDate: '',
    value: '',
    priority: 'normal',
    brief: '',
  })

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => {})
  }, [])

  function set(key: string, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function toggleType(t: string) {
    setForm(f => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t],
    }))
  }

  async function handleSubmit() {
    if (!form.name || !form.customerId) return
    setSaving(true)
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          customerId: form.customerId,
          assignee: form.assignee,
          type: form.types.join(', ') || 'Other',
          status: form.status,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          value: parseFloat(form.value) || 0,
          priority: form.priority,
          brief: form.brief,
        }),
      })
      router.push('/projects')
    } catch {
      setSaving(false)
    }
  }

  const selectedCustomer = customers.find(c => c.id === form.customerId)
  const previewCode = `PJ-${new Date().getFullYear()}-XXX`
  const s = STATUS_MAP[form.status]

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7a8893', marginBottom: 4 }}>
            <Link href="/projects" style={{ color: '#7a8893', textDecoration: 'none' }}>โปรเจกต์ทั้งหมด</Link>
            <span>/</span>
            <span style={{ color: '#2f3b45' }}>สร้างโปรเจกต์ใหม่</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>สร้างโปรเจกต์ใหม่</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/projects"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f3f5', color: '#5f7d99', borderRadius: 10, padding: '9px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            ยกเลิก
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name || !form.customerId}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: !form.name || !form.customerId ? '#c8d4de' : '#5f7d99', color: '#fff', borderRadius: 10, padding: '9px 18px', fontSize: 14, fontWeight: 600, border: 'none', cursor: !form.name || !form.customerId ? 'not-allowed' : 'pointer' }}
          >
            {saving ? (
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>autorenew</span>
            ) : (
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
            )}
            สร้างโปรเจกต์
          </button>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Left */}
        <div style={{ flex: 1.7, minWidth: 0 }}>
          {/* Project Info */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>info</span>
              ข้อมูลโปรเจกต์
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>ชื่อโปรเจกต์ *</label>
                <input
                  style={inputStyle}
                  placeholder="เช่น โลโก้ LUXE Brand"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>ลูกค้า *</label>
                <select
                  style={{ ...inputStyle, appearance: 'none' }}
                  value={form.customerId}
                  onChange={e => set('customerId', e.target.value)}
                >
                  <option value="">เลือกลูกค้า</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>ผู้รับผิดชอบ</label>
                <input
                  style={inputStyle}
                  placeholder="ชื่อผู้รับผิดชอบ"
                  value={form.assignee}
                  onChange={e => set('assignee', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Job Types */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>palette</span>
              ประเภทงาน
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {JOB_TYPES.map(t => {
                const active = form.types.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: active ? '1.5px solid #5f7d99' : '1.5px solid #dde3e9', background: active ? '#e8eef4' : '#fff', color: active ? '#5f7d99' : '#7a8893', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>flag</span>
              สถานะเริ่มต้น
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUSES.map(st => {
                const sm = STATUS_MAP[st]
                const active = form.status === st
                return (
                  <button
                    key={st}
                    onClick={() => set('status', st)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: active ? `1.5px solid ${sm.color}` : '1.5px solid #dde3e9', background: active ? sm.bg : '#fff', color: active ? sm.color : '#7a8893', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {sm.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Schedule & Value */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>schedule</span>
              กำหนดการ & มูลค่า
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>วันที่เริ่ม</label>
                <input type="date" style={inputStyle} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>กำหนดส่ง</label>
                <input type="date" style={inputStyle} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>มูลค่างาน (บาท)</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="0.00"
                  value={form.value}
                  onChange={e => set('value', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>ระดับความสำคัญ</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="low">ต่ำ</option>
                  <option value="normal">ปกติ</option>
                  <option value="high">สูง</option>
                  <option value="urgent">เร่งด่วน</option>
                </select>
              </div>
            </div>
          </div>

          {/* Brief */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>description</span>
              Brief
            </div>
            <textarea
              style={{ ...inputStyle, height: 120, padding: '10px 12px', resize: 'vertical', lineHeight: 1.6 }}
              placeholder="รายละเอียดโปรเจกต์, ความต้องการพิเศษ, เอกสารอ้างอิง..."
              value={form.brief}
              onChange={e => set('brief', e.target.value)}
            />
          </div>
        </div>

        {/* Right - Preview */}
        <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 0 }}>
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>preview</span>
              สรุปโปรเจกต์
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #edf0f3' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9fb0bf', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>รหัสโปรเจกต์</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#5f7d99' }}>{previewCode}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>ชื่อโปรเจกต์</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>{form.name || <span style={{ color: '#c8d4de' }}>ยังไม่ได้ระบุ</span>}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>ลูกค้า</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>{selectedCustomer?.name || <span style={{ color: '#c8d4de' }}>ยังไม่ได้เลือก</span>}</div>
              </div>

              {form.types.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 6 }}>ประเภทงาน</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {form.types.map(t => (
                      <span key={t} style={{ padding: '3px 10px', borderRadius: 6, background: '#e8eef4', color: '#5f7d99', fontSize: 11, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 6 }}>สถานะ</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 26, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
              </div>

              {form.value && (
                <div>
                  <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>มูลค่างาน</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2f3b45' }}>{fmt(parseFloat(form.value) || 0)}</div>
                </div>
              )}

              {form.dueDate && (
                <div>
                  <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>กำหนดส่ง</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2f3b45', fontWeight: 500 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#9fb0bf' }}>calendar_today</span>
                    {form.dueDate}
                  </div>
                </div>
              )}

              {form.priority !== 'normal' && (
                <div>
                  <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>ความสำคัญ</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: form.priority === 'urgent' ? '#e05a4a' : form.priority === 'high' ? '#f4a431' : '#7a8893' }}>
                    {form.priority === 'urgent' ? 'เร่งด่วน' : form.priority === 'high' ? 'สูง' : form.priority === 'low' ? 'ต่ำ' : 'ปกติ'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #edf0f3' }}>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name || !form.customerId}
                style={{ width: '100%', background: !form.name || !form.customerId ? '#c8d4de' : '#5f7d99', color: '#fff', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 600, border: 'none', cursor: !form.name || !form.customerId ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'กำลังสร้าง...' : 'สร้างโปรเจกต์'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
