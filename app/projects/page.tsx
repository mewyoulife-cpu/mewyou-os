'use client'

import { useEffect, useState } from 'react'
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

const STATUS_PROGRESS: Record<string, number> = {
  lead: 5, brief: 15, quotation: 25, payment: 35,
  design: 55, revision: 70, approved: 82, deliver: 92, completed: 100,
}

const KANBAN_COLUMNS = [
  { key: 'brief', label: 'Brief', statuses: ['brief', 'quotation'] },
  { key: 'design', label: 'ออกแบบ', statuses: ['design'] },
  { key: 'revision', label: 'รออนุมัติ', statuses: ['revision'] },
  { key: 'payment', label: 'ชำระเงิน', statuses: ['payment'] },
  { key: 'deliver', label: 'รอส่งมอบ', statuses: ['deliver', 'approved'] },
  { key: 'completed', label: 'เสร็จสิ้น', statuses: ['completed'] },
]

function fmt(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, bg: '#f0f2f5', color: '#8a97a2' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
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
      .then(data => { setProjects(data); setLoading(false) })
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

  const card = {
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #edf0f3',
    padding: '20px 22px',
  } as const

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45' }}>โปรเจกต์ทั้งหมด</div>
          <div style={{ fontSize: 13, color: '#7a8893', marginTop: 2 }}>
            {loading ? 'กำลังโหลด...' : `${projects.length} โปรเจกต์`}
          </div>
        </div>
        <Link
          href="/projects/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#5f7d99', color: '#fff', borderRadius: 10, padding: '9px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
          สร้างโปรเจกต์
        </Link>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <span className="material-symbols-rounded" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9fb0bf' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาโปรเจกต์..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, height: 38, borderRadius: 10, border: '1px solid #dde3e9', fontSize: 13, color: '#2f3b45', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        {/* View Toggle */}
        <div style={{ display: 'flex', background: '#edf0f3', borderRadius: 10, padding: 3, gap: 2 }}>
          {(['list', 'kanban'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: view === v ? '#fff' : 'transparent', color: view === v ? '#2f3b45' : '#7a8893', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{v === 'list' ? 'view_list' : 'view_kanban'}</span>
              {v === 'list' ? 'ลิสต์' : 'Kanban'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#7a8893' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>autorenew</span>
        </div>
      ) : view === 'list' ? (
        /* LIST VIEW */
        <div style={card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                  {['รหัสโปรเจกต์', 'ชื่อลูกค้า', 'ประเภทงาน', 'สถานะ', 'ความคืบหน้า', 'กำหนดส่ง', 'มูลค่า'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#7a8893', fontWeight: 500, whiteSpace: 'nowrap', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#7a8893' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8, opacity: 0.4 }}>folder_open</span>
                      ยังไม่มีโปรเจกต์
                    </td>
                  </tr>
                ) : filtered.map(p => {
                  const pct = STATUS_PROGRESS[p.status] || 0
                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}`)}
                      style={{ borderBottom: '1px solid #f4f6f8', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#5f7d99' }}>{p.code}</td>
                      <td style={{ padding: '12px 14px', color: '#2f3b45', fontWeight: 500 }}>{p.customer?.name || '-'}</td>
                      <td style={{ padding: '12px 14px', color: '#7a8893' }}>{p.type}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: '12px 14px', minWidth: 110 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#edf0f3', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#5f7d99', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#7a8893', width: 28 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#7a8893', whiteSpace: 'nowrap' }}>{p.dueDate || '-'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2f3b45', whiteSpace: 'nowrap' }}>{fmt(p.value)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map(col => {
              const colProjects = filtered.filter(p => col.statuses.includes(p.status))
              const s = STATUS_MAP[col.key] || { bg: '#f0f2f5', color: '#8a97a2' }
              return (
                <div key={col.key} style={{ width: 262, flexShrink: 0 }}>
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#2f3b45' }}>{col.label}</div>
                    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '1px 7px', fontSize: 12, fontWeight: 700 }}>{colProjects.length}</span>
                  </div>
                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {colProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}`)}
                        style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '14px', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(95,125,153,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
                      >
                        {/* Image placeholder */}
                        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 10, background: '#f4f6f8', border: '1.5px dashed #dde3e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 28, color: '#c8d4de' }}>image</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#9fb0bf', fontWeight: 600, marginBottom: 3 }}>{p.code}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45', marginBottom: 2 }}>{p.customer?.name || '-'}</div>
                        <div style={{ fontSize: 12, color: '#7a8893', marginBottom: 10 }}>{p.type}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7a8893' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 13 }}>calendar_today</span>
                            {p.dueDate || '-'}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#2f3b45' }}>{fmt(p.value)}</div>
                        </div>
                      </div>
                    ))}
                    {colProjects.length === 0 && (
                      <div style={{ borderRadius: 14, border: '1.5px dashed #dde3e9', padding: '24px 16px', textAlign: 'center', color: '#c8d4de', fontSize: 12 }}>
                        ไม่มีโปรเจกต์
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
