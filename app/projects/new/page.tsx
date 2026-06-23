'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; num: number }> = {
  lead:      { label: 'Lead',      bg: '#eef2f5', color: '#8fa7bc', num: 1 },
  brief:     { label: 'Brief',     bg: '#e8f1f9', color: '#6b96c2', num: 2 },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd', num: 3 },
  payment:   { label: 'Payment',   bg: '#fdf3e3', color: '#f4a431', num: 4 },
  design:    { label: 'Design',    bg: '#e8eef4', color: '#5f7d99', num: 5 },
  revision:  { label: 'Revision',  bg: '#fceee8', color: '#e07b54', num: 6 },
  approved:  { label: 'Approved',  bg: '#e9f3ed', color: '#3d8a64', num: 7 },
  billing:   { label: 'Billing',   bg: '#fdeede', color: '#e08a2b', num: 8 },
  deliver:   { label: 'Deliver',   bg: '#e3f2fd', color: '#2196f3', num: 9 },
  completed: { label: 'Completed', bg: '#e8f5e9', color: '#4caf50', num: 10 },
}

const JOB_TYPES = ['Label Design', 'Packaging', 'Logo/CI', 'Illustration', 'Motion Design', 'Publication', 'Brand Identity', 'อื่นๆ']
const STATUSES = Object.keys(STATUS_MAP)

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'ต่ำ',      color: '#9aa7b2', bg: '#f0f2f5' },
  { value: 'normal', label: 'ปกติ',     color: '#5f7d99', bg: '#e8eef4' },
  { value: 'high',   label: 'สูง',      color: '#f4a431', bg: '#fdf3e3' },
  { value: 'urgent', label: 'เร่งด่วน', color: '#e05a4a', bg: '#fceee8' },
]

type Customer = { id: string; name: string; company?: string }

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

const cardHeadingStyle: React.CSSProperties = {
  fontSize: 15.5,
  fontWeight: 600,
  color: '#2f3b45',
  marginBottom: 18,
}

const labelDivStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: '#7a8893',
  marginBottom: 6,
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
  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === form.priority)!

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 6px' }}>
        <Link href="/projects" style={{ color: '#9aa7b2', textDecoration: 'none' }}>โปรเจกต์ทั้งหมด</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77' }}>สร้างใหม่</span>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '0 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>สร้างโปรเจกต์ใหม่</div>
          <div style={{ fontSize: 13, color: '#9aa7b2', marginTop: 2, fontFamily: "'IBM Plex Sans', monospace" }}>{previewCode}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/projects"
            style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 16px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, cursor: 'pointer', background: '#fff', textDecoration: 'none' }}
          >
            ยกเลิก
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', borderRadius: 10, background: '#5f7d99', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)', border: 'none' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check</span>
            สร้างโปรเจกต์
          </button>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* LEFT */}
        <div style={{ flex: '1.7 1 460px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Card 1: ข้อมูลโปรเจกต์ */}
          <div style={cardStyle}>
            <div style={cardHeadingStyle}>ข้อมูลโปรเจกต์</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* ชื่อโปรเจกต์ */}
              <div>
                <div style={labelDivStyle}>ชื่อโปรเจกต์ <span style={{ color: '#c4593f' }}>*</span></div>
                <input
                  style={inputStyle}
                  placeholder="เช่น Body Serum Label, Collagen Packaging"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              {/* ลูกค้า + ผู้รับผิดชอบ */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={labelDivStyle}>ลูกค้า <span style={{ color: '#c4593f' }}>*</span></div>
                  <select
                    style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
                    value={form.customerId}
                    onChange={e => set('customerId', e.target.value)}
                  >
                    <option value="">เลือกลูกค้า</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={labelDivStyle}>ผู้รับผิดชอบ</div>
                  <input
                    style={inputStyle}
                    placeholder="ชื่อผู้รับผิดชอบ"
                    value={form.assignee}
                    onChange={e => set('assignee', e.target.value)}
                  />
                </div>
              </div>
              {/* ประเภทงาน */}
              <div>
                <div style={labelDivStyle}>ประเภทงาน</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
                  {JOB_TYPES.map(t => {
                    const active = form.types.includes(t)
                    return (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          border: active ? '1.5px solid #5f7d99' : '1.5px solid #dde3e9',
                          background: active ? '#e8eef4' : '#fff',
                          color: active ? '#5f7d99' : '#7a8893',
                          fontSize: 13,
                          fontWeight: active ? 600 : 400,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: สถานะเริ่มต้น */}
          <div style={cardStyle}>
            <div style={cardHeadingStyle}>สถานะเริ่มต้น</div>
            <div style={{ fontSize: 12, color: '#9aa7b2', marginBottom: 14 }}>เลือกขั้นตอนที่โปรเจกต์เริ่มต้น (ปกติเริ่มที่ Lead)</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.map(st => {
                const sm = STATUS_MAP[st]
                const active = form.status === st
                return (
                  <button
                    key={st}
                    onClick={() => set('status', st)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      border: `1.5px solid ${active ? sm.color : '#dde3e9'}`,
                      background: active ? sm.bg : '#fff',
                      color: active ? sm.color : '#7a8893',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                      background: active ? sm.color : '#c8d4de',
                    }}>
                      {sm.num}
                    </span>
                    {sm.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Card 3: กำหนดการ & มูลค่า */}
          <div style={cardStyle}>
            <div style={cardHeadingStyle}>กำหนดการ & มูลค่า</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={labelDivStyle}>วันที่เริ่ม</div>
                <input
                  type="date"
                  style={{ height: 40, border: '1px solid #e4e8ec', borderRadius: 10, padding: '0 12px', width: '100%', fontSize: 14, color: '#5b6b77', outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={labelDivStyle}>กำหนดส่ง</div>
                <input
                  type="date"
                  style={{ height: 40, border: '1px solid #e4e8ec', borderRadius: 10, padding: '0 12px', width: '100%', fontSize: 14, color: '#5b6b77', outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  value={form.dueDate}
                  onChange={e => set('dueDate', e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={labelDivStyle}>มูลค่างาน (บาท)</div>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="0"
                  value={form.value}
                  onChange={e => set('value', e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={labelDivStyle}>ระดับความสำคัญ</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
                {PRIORITY_OPTIONS.map(p => {
                  const active = form.priority === p.value
                  return (
                    <button
                      key={p.value}
                      onClick={() => set('priority', p.value)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: active ? `1.5px solid ${p.color}` : '1.5px solid #dde3e9',
                        background: active ? p.bg : '#fff',
                        color: active ? p.color : '#7a8893',
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Card 4: รายละเอียดงาน / Brief */}
          <div style={cardStyle}>
            <div style={{ ...cardHeadingStyle, marginBottom: 12 }}>รายละเอียดงาน / Brief</div>
            <textarea
              style={{ width: '100%', minHeight: 90, border: '1px solid #e4e8ec', borderRadius: 10, padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: '#5b6b77', outline: 'none', resize: 'vertical', background: '#fff', boxSizing: 'border-box', lineHeight: 1.5 }}
              placeholder="สรุปความต้องการของลูกค้า สไตล์ โทนสี ขนาด ฯลฯ"
              value={form.brief}
              onChange={e => set('brief', e.target.value)}
            />
            {/* Upload area (UI only) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 14, padding: 14, border: '1.5px dashed #d4dce2', borderRadius: 11, cursor: 'pointer' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#9fb6c9' }}>cloud_upload</span>
              <div>
                <div style={{ fontSize: 13.5, color: '#5b6b77' }}>แนบไฟล์ Brief / Reference</div>
                <div style={{ fontSize: 12, color: '#9aa7b2' }}>รองรับ AI, PSD, PDF, PNG, JPG · ลากไฟล์มาวางหรือคลิกเพื่อเลือก</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 330, flex: '1 1 290px', position: 'sticky', top: 6, background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }}>
          <div style={cardHeadingStyle}>สรุปโปรเจกต์</div>

          {/* Preview box */}
          <div style={{ background: '#f5f7f9', borderRadius: 13, padding: 18, marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{previewCode}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2f3b45', marginTop: 3, wordBreak: 'break-word' }}>
              {form.name || <span style={{ color: '#c8d4de', fontWeight: 400 }}>ยังไม่ได้ระบุชื่อ</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#9fb0bf' }}>person</span>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>{selectedCustomer?.name || <span style={{ color: '#c8d4de' }}>ยังไม่ได้เลือกลูกค้า</span>}</span>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#9aa7b2' }}>ประเภทงาน</span>
              <span style={{ fontSize: 13.5, color: '#2f3b45', fontWeight: 500 }}>
                {form.types.length > 0 ? form.types.join(', ') : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#9aa7b2' }}>สถานะ</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, background: s.bg, color: s.color }}>
                {s.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#9aa7b2' }}>ความสำคัญ</span>
              <span style={{ fontSize: 13.5, color: selectedPriority.color, fontWeight: 500 }}>{selectedPriority.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#9aa7b2' }}>กำหนดส่ง</span>
              <span style={{ fontSize: 13.5, color: '#2f3b45', fontWeight: 500 }}>{form.dueDate || '—'}</span>
            </div>
          </div>

          {/* Divider + มูลค่างาน */}
          <div style={{ paddingTop: 14, borderTop: '1.5px solid #eef1f4', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 13 }}>
            <span style={{ fontSize: 13, color: '#9aa7b2' }}>มูลค่างาน</span>
            <span style={{ fontSize: 21, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', monospace" }}>
              ฿{form.value ? Number(form.value).toLocaleString() : '0'}
            </span>
          </div>

          {/* Create button */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 46, borderRadius: 12, background: '#5f7d99', color: '#fff', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', marginTop: 20, boxShadow: '0 4px 12px rgba(95,125,153,.3)', border: 'none' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add_task</span>
            {saving ? 'กำลังสร้าง...' : 'สร้างโปรเจกต์'}
          </button>

          {/* Warning */}
          {(!form.name || !form.customerId) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, fontSize: 12, color: '#a9762f' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>info</span>
              กรอกชื่อโปรเจกต์และเลือกลูกค้าก่อน
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
