'use client'

import { useEffect, useRef, useState } from 'react'
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

// A small dropdown filter (status / work type) with click-outside handling.
function FilterDropdown({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const active = options.find(o => o.value === value)
  const isFiltered = value !== 'all'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px',
          border: `1px solid ${isFiltered ? '#5f7d99' : '#eaedf0'}`, borderRadius: 10,
          fontSize: 13.5, color: isFiltered ? '#5f7d99' : '#5b6b77', fontWeight: isFiltered ? 600 : 400,
          cursor: 'pointer', background: isFiltered ? '#eef3f7' : '#fff', whiteSpace: 'nowrap',
        }}
      >
        {isFiltered ? active?.label : label}
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: '#fff', border: '1px solid #e4e8ec', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(47,59,69,.14)', padding: 6, minWidth: 180,
          maxHeight: 320, overflowY: 'auto',
        }}>
          {options.map(o => {
            const sel = o.value === value
            return (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  height: 36, padding: '0 11px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13.5, color: sel ? '#5f7d99' : '#3b4954', fontWeight: sel ? 600 : 400,
                  background: sel ? '#eef3f7' : 'transparent',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#f5f7f9' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                {o.label}
                {sel && <span className="material-symbols-rounded" style={{ fontSize: 17 }}>check</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
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
  image?: string | null
  customer: { name: string } | null
}

// Compress an image file to a small JPEG data URL suitable for storing in the DB
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const maxW = 640
        const scale = Math.min(1, maxW / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function KanbanCard({ project, onOpen, onImageChange }: {
  project: Project
  onOpen: () => void
  onImageChange: (id: string, image: string | null) => void
}) {
  const [uploading, setUploading] = useState(false)

  async function saveImage(image: string | null) {
    onImageChange(project.id, image)
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
    } catch {
      // keep optimistic state; will reconcile on next load
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      await saveImage(dataUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onClick={onOpen}
      style={{ background: '#ffffff', borderRadius: 11, border: '1px solid #edf0f3', padding: '13px 14px', cursor: 'pointer' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(40,60,80,.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      {project.image ? (
        <div onClick={e => e.stopPropagation()} style={{ position: 'relative', marginBottom: 11 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.image} alt={project.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 9, display: 'block' }} />
          <label style={{ position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, borderRadius: 8, background: 'rgba(47,59,69,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#fff' }}>photo_camera</span>
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          <div onClick={() => saveImage(null)} style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 8, background: 'rgba(47,59,69,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#fff' }}>close</span>
          </div>
        </div>
      ) : (
        <label onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, aspectRatio: '1/1', border: '1.5px dashed #d4dce2', borderRadius: 9, cursor: 'pointer', marginBottom: 11, background: '#fafbfc' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#bcc7d1' }}>{uploading ? 'hourglass_empty' : 'add_photo_alternate'}</span>
          <span style={{ fontSize: 11.5, color: '#9aa7b2' }}>{uploading ? 'กำลังอัปโหลด...' : 'เพิ่มรูปงานออกแบบ'}</span>
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      )}
      <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: 4 }}>{project.code}</div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: '#2f3b45', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
      <div style={{ fontSize: 12.5, color: '#5b6b77', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.customer?.name || '—'}</div>
      <div style={{ fontSize: 12.5, color: '#7a8893', marginTop: 2 }}>{project.type}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 11, borderTop: '1px solid #f2f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8a97a2' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 15 }}>event</span>
          {project.dueDate ? project.dueDate.slice(0, 10) : '—'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif" }}>{fmtValue(project.value)}</div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Status options: only statuses present in the data, ordered by progress.
  const statusOptions = [
    { value: 'all', label: 'ทุกสถานะ' },
    ...Array.from(new Set(projects.map(p => p.status)))
      .sort((a, b) => (STATUS_PROGRESS[a] ?? 999) - (STATUS_PROGRESS[b] ?? 999))
      .map(s => ({ value: s, label: STATUS_MAP[s]?.label || s })),
  ]
  // Type options: distinct work types present in the data.
  const typeOptions = [
    { value: 'all', label: 'ทุกประเภท' },
    ...Array.from(new Set(projects.map(p => p.type).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'th'))
      .map(t => ({ value: t, label: t })),
  ]

  const filtered = projects.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.customer?.name || '').toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    )
  })

  const activeCount = projects.filter(p => !['completed', 'lead'].includes(p.status)).length
  const hasFilter = statusFilter !== 'all' || typeFilter !== 'all' || search.trim() !== ''

  async function deleteProject(id: string, name: string) {
    if (!confirm(`ลบโปรเจกต์ "${name}" ?\nการลบนี้ย้อนกลับไม่ได้`)) return
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) { alert('ลบไม่สำเร็จ กรุณาลองใหม่'); return }
      setProjects(ps => ps.filter(p => p.id !== id))
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>โปรเจกต์ทั้งหมด</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>
            {loading
              ? 'กำลังโหลด...'
              : hasFilter
                ? `พบ ${filtered.length} จาก ${projects.length} โปรเจกต์`
                : `ทั้งหมด ${projects.length} โปรเจกต์ · กำลังดำเนินการ ${activeCount}`}
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
          <FilterDropdown label="สถานะ" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <FilterDropdown label="ประเภทงาน" value={typeFilter} options={typeOptions} onChange={setTypeFilter} />
          {hasFilter && (
            <div
              onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearch('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, height: 40, padding: '0 12px', borderRadius: 10, fontSize: 13, color: '#9aa7b2', cursor: 'pointer', background: 'transparent' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 17 }}>close</span>
              ล้างตัวกรอง
            </div>
          )}
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
            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.4fr 1.1fr 1fr 1fr 1.2fr 0.85fr 0.85fr 34px', gap: 8, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 12px', borderBottom: '1px solid #f0f2f5' }}>
              <div>รหัสโปรเจกต์</div>
              <div>ชื่อโปรเจกต์</div>
              <div>ชื่อลูกค้า</div>
              <div>ประเภทงาน</div>
              <div>สถานะ</div>
              <div>ความคืบหน้า</div>
              <div>กำหนดส่ง</div>
              <div style={{ textAlign: 'right' }}>มูลค่า</div>
              <div />
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9aa7b2', padding: '48px 0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>folder_open</span>
                {hasFilter ? 'ไม่พบโปรเจกต์ที่ตรงกับตัวกรอง' : 'ยังไม่มีโปรเจกต์'}
              </div>
            ) : filtered.map(p => {
              const pct = STATUS_PROGRESS[p.status] || 0
              const s = STATUS_MAP[p.status] || { label: p.status, bg: '#f0f2f5', color: '#8a97a2' }
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.4fr 1.1fr 1fr 1fr 1.2fr 0.85fr 0.85fr 34px', gap: 8, alignItems: 'center', fontSize: 13.5, padding: '14px 4px', borderBottom: '1px solid #f4f6f8', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }}>{p.code}</div>
                  <div style={{ fontWeight: 600, color: '#2f3b45', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ color: '#5b6b77', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.customer?.name || '—'}</div>
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
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span
                      onClick={e => { e.stopPropagation(); deleteProject(p.id, p.name) }}
                      title="ลบโปรเจกต์"
                      className="material-symbols-rounded"
                      style={{ fontSize: 19, color: '#c0ccd6', cursor: 'pointer', borderRadius: 6, padding: 2 }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#d9534f'; e.currentTarget.style.background = '#fceeec' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#c0ccd6'; e.currentTarget.style.background = 'transparent' }}
                    >delete</span>
                  </div>
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
                      <KanbanCard
                        key={p.id}
                        project={p}
                        onOpen={() => router.push(`/projects/${p.id}`)}
                        onImageChange={(pid, image) => setProjects(prev => prev.map(x => x.id === pid ? { ...x, image } : x))}
                      />
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
