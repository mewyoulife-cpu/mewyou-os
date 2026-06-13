'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  lead:      { label: 'Lead',      bg: '#eef2f5', color: '#8fa7bc' },
  brief:     { label: 'Brief',     bg: '#e8f1f9', color: '#6b96c2' },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd' },
  payment:   { label: 'Payment',   bg: '#fdf3e3', color: '#f4a431' },
  design:    { label: 'Design',    bg: '#e8eef4', color: '#5f7d99' },
  revision:  { label: 'Revision',  bg: '#fceee8', color: '#e07b54' },
  approved:  { label: 'Approved',  bg: '#e9f3ed', color: '#3d8a64' },
  deliver:   { label: 'Deliver',   bg: '#e3f2fd', color: '#2196f3' },
  completed: { label: 'Completed', bg: '#e8f5e9', color: '#4caf50' },
}

const STATUS_PROGRESS: Record<string, number> = {
  lead: 5, brief: 15, quotation: 25, payment: 35,
  design: 55, revision: 70, approved: 82, deliver: 92, completed: 100,
}

const KANBAN_COLUMNS = [
  { key: 'brief',     label: 'Brief',    statuses: ['brief', 'quotation'] },
  { key: 'design',    label: 'ออกแบบ',   statuses: ['design'] },
  { key: 'revision',  label: 'รออนุมัติ', statuses: ['revision'] },
  { key: 'payment',   label: 'ชำระเงิน', statuses: ['payment'] },
  { key: 'deliver',   label: 'รอส่งมอบ', statuses: ['deliver', 'approved'] },
  { key: 'completed', label: 'เสร็จสิ้น', statuses: ['completed'] },
]

function fmtValue(n: number) {
  return '฿' + n.toLocaleString('th-TH')
}

type Project = {
  id: string
  code: string
  name: string
  type: string
  status: string
  value: number
  dueDate: string | null
  customer: { name: string } | null
}

export default function ProjectsPage() {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.customer?.name || '').toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    )
  })

  const activeCount = projects.filter(p => !['completed', 'lead'].includes(p.status)).length

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>โปรเจกต์ทั้งหมด</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>
            {loading ? 'กำลังโหลด...' : `ทั้งหมด ${projects.length} โปรเจกต์ · กำลังดำเนินการ ${activeCount}`}
          </div>
        </div>
        <Link
          href="/projects/new"
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 42, padding: '0 18px', borderRadius: 11, background: '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(95,125,153,.3)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
          สร้างโปรเจกต์
        </Link>
      </div>

      {/* Main Card */}
      <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: '18px 20px' }}>
        {/* Filter Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 9, background: '#f5f7f9', border: '1px solid #eaedf0', borderRadius: 10, height: 40, padding: '0 14px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9aa7b2' }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาโปรเจกต์, ลูกค้า, ประเภทงาน..."
              style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'inherit', fontSize: 13.5, color: '#2f3b45' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', border: '1px solid #eaedf0', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', cursor: 'pointer', background: '#fff' }}>
            สถานะ<span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>expand_more</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', border: '1px solid #eaedf0', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', cursor: 'pointer', background: '#fff' }}>
            ประเภทงาน<span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>expand_more</span>
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4, background: '#f5f7f9', border: '1px solid #eaedf0', borderRadius: 11, padding: 3 }}>
            {(['list', 'kanban'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: view === v ? '#fff' : 'transparent', color: view === v ? '#2f3b45' : '#7a8893', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 19 }}>{v === 'list' ? 'view_list' : 'view_kanban'}</span>
                {v === 'list' ? 'List' : 'Kanban'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>hourglass_empty</span>
            กำลังโหลด...
          </div>
        ) : view === 'list' ? (
          /* LIST VIEW */
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1.2fr 1fr 1.3fr 0.9fr 0.9fr', gap: 8, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 12px', borderBottom: '1px solid #f0f2f5' }}>
              <div>รหัสโปรเจกต์</div>
              <div>ชื่อลูกค้า</div>
              <div>ประเภทงาน</div>
              <div>สถานะ</div>
              <div>ความคืบหน้า</div>
              <div>กำหนดส่ง</div>
              <div style={{ textAlign: 'right' }}>มูลค่า</div>
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9aa7b2', padding: '48px 0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>folder_open</span>
                ยังไม่มีโปรเจกต์
              </div>
            ) : filtered.map(p => {
              const pct = STATUS_PROGRESS[p.status] || 0
              const s = STATUS_MAP[p.status] || { label: p.status, bg: '#f0f2f5', color: '#8a97a2' }
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1.2fr 1fr 1.3fr 0.9fr 0.9fr', gap: 8, alignItems: 'center', fontSize: 13.5, padding: '14px 4px', borderBottom: '1px solid #f4f6f8', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }}>{p.code}</div>
                  <div style={{ fontWeight: 600, color: '#2f3b45' }}>{p.customer?.name || '—'}</div>
                  <div style={{ color: '#7a8893', fontSize: 13 }}>{p.type}</div>
                  <div>
                    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 4, background: '#eef1f4', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#5f7d99', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#7a8893', width: 30 }}>{pct}%</span>
                  </div>
                  <div style={{ color: '#7a8893', fontSize: 13 }}>{p.dueDate ? p.dueDate.slice(0, 10) : '—'}</div>
                  <div style={{ textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{fmtValue(p.value)}</div>
                </div>
              )
            })}
          </>
        ) : (
          /* KANBAN VIEW */
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {KANBAN_COLUMNS.map(col => {
              const colProjects = filtered.filter(p => col.statuses.includes(p.status))
              const s = STATUS_MAP[col.key] || { bg: '#f0f2f5', color: '#8a97a2' }
              return (
                <div key={col.key} style={{ width: 262, flexShrink: 0, background: '#f5f7f9', borderRadius: 14, padding: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13, padding: '0 3px' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#3b4954', flex: 1 }}>{col.label}</span>
                    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '1px 7px', fontSize: 12, fontWeight: 700 }}>{colProjects.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {colProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}`)}
                        style={{ background: '#ffffff', borderRadius: 11, border: '1px solid #edf0f3', padding: '13px 14px', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(40,60,80,.1)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, aspectRatio: '1/1', border: '1.5px dashed #d4dce2', borderRadius: 9, cursor: 'pointer', marginBottom: 11, background: '#fafbfc' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#bcc7d1' }}>add_photo_alternate</span>
                          <span style={{ fontSize: 11.5, color: '#9aa7b2' }}>เพิ่มรูปงานออกแบบ</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: 4 }}>{p.code}</div>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: '#2f3b45' }}>{p.customer?.name || '—'}</div>
                        <div style={{ fontSize: 12.5, color: '#7a8893', marginTop: 2 }}>{p.type}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 11, borderTop: '1px solid #f2f4f6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8a97a2' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>event</span>
                            {p.dueDate ? p.dueDate.slice(0, 10) : '—'}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif" }}>{fmtValue(p.value)}</div>
                        </div>
                      </div>
                    ))}
                    {colProjects.length === 0 && (
                      <div style={{ borderRadius: 11, border: '1.5px dashed #d4dce2', padding: '24px 16px', textAlign: 'center', color: '#c8d4de', fontSize: 12 }}>
                        ไม่มีโปรเจกต์
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
