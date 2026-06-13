'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

const STEPS = ['lead', 'brief', 'quotation', 'payment', 'design', 'revision', 'approved', 'deliver', 'completed']

function fmt(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

type Project = {
  id: string
  code: string
  name: string
  type: string
  status: string
  priority: string
  value: number
  cost: number
  deposit: number
  startDate: string | null
  dueDate: string | null
  brief: string | null
  assignee: string | null
  revisions: number
  customer: {
    id: string
    name: string
    company?: string
    phone?: string
    email?: string
  } | null
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/projects/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(data => { setProject(data); setNewStatus(data.status); setLoading(false) })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  async function handleStatusChange(status: string) {
    if (!project || status === project.status) return
    setChangingStatus(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const updated = await res.json()
      setProject(updated)
      setNewStatus(updated.status)
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleDelete() {
    if (!confirm('ลบโปรเจกต์นี้?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/projects')
  }

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #edf0f3',
    padding: '20px 22px',
    marginBottom: 16,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#7a8893', gap: 10 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 28 }}>autorenew</span>
        กำลังโหลด...
      </div>
    )
  }

  if (notFound || !project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#7a8893', gap: 12 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 48, opacity: 0.4 }}>folder_off</span>
        <div style={{ fontSize: 16, fontWeight: 600 }}>ไม่พบโปรเจกต์</div>
        <Link href="/projects" style={{ color: '#5f7d99', fontSize: 14 }}>← กลับไปรายการ</Link>
      </div>
    )
  }

  const currentStepIndex = STEPS.indexOf(project.status)
  const s = STATUS_MAP[project.status] || { label: project.status, bg: '#f0f2f5', color: '#8a97a2' }
  const profit = project.value - project.cost
  const profitMargin = project.value > 0 ? ((profit / project.value) * 100).toFixed(1) : '0.0'

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7a8893', marginBottom: 16 }}>
        <Link href="/projects" style={{ color: '#7a8893', textDecoration: 'none' }}>โปรเจกต์ทั้งหมด</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>chevron_right</span>
        <span style={{ color: '#2f3b45', fontWeight: 500 }}>{project.customer?.name || project.name}</span>
      </div>

      {/* Project Header */}
      <div style={{ ...card, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9fb0bf', letterSpacing: '0.06em' }}>{project.code}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
            {project.priority === 'urgent' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: '#fde8e6', color: '#e05a4a' }}>เร่งด่วน</span>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45', marginBottom: 4 }}>{project.name}</div>
          <div style={{ fontSize: 14, color: '#7a8893' }}>
            {project.customer?.name}{project.customer?.company ? ` • ${project.customer.company}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {/* Status selector */}
          <select
            value={newStatus}
            disabled={changingStatus}
            onChange={e => handleStatusChange(e.target.value)}
            style={{ height: 38, borderRadius: 10, border: '1px solid #dde3e9', padding: '0 12px', fontSize: 13, color: '#2f3b45', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
          >
            {STEPS.map(st => (
              <option key={st} value={st}>{STATUS_MAP[st]?.label || st}</option>
            ))}
          </select>
          <button
            onClick={handleDelete}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 38, padding: '0 14px', borderRadius: 10, border: '1px solid #fde8e6', background: '#fff', color: '#e05a4a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
          </button>
        </div>
      </div>

      {/* 9-Step Progress Stepper */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>ความคืบหน้า</div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
          {/* Connector line */}
          <div style={{ position: 'absolute', top: 14, left: 14, right: 14, height: 2, background: '#edf0f3', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 14, left: 14, height: 2, background: '#5f7d99', zIndex: 0, width: currentStepIndex >= 0 ? `${(currentStepIndex / (STEPS.length - 1)) * (100 - 0)}%` : '0%', transition: 'width 0.4s' }} />

          {STEPS.map((step, i) => {
            const sm = STATUS_MAP[step]
            const isPast = i < currentStepIndex
            const isCurrent = i === currentStepIndex
            const isFuture = i > currentStepIndex

            return (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <button
                  onClick={() => handleStatusChange(step)}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', background: isPast ? '#3d8a64' : isCurrent ? '#5f7d99' : '#edf0f3' }}
                >
                  {isPast ? (
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#fff' }}>check</span>
                  ) : isCurrent ? (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c8d4de' }} />
                  )}
                </button>
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#2f3b45' : isFuture ? '#c8d4de' : '#7a8893', whiteSpace: 'nowrap' }}>
                    {sm?.label || step}
                  </div>
                  {isCurrent && <div style={{ fontSize: 9, color: '#5f7d99', fontWeight: 600, marginTop: 1 }}>ปัจจุบัน</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {/* Left Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>รายละเอียด</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {[
                { label: 'ลูกค้า', value: project.customer?.name || '-', icon: 'person' },
                { label: 'ประเภทงาน', value: project.type || '-', icon: 'palette' },
                { label: 'กำหนดส่ง', value: project.dueDate || '-', icon: 'calendar_today' },
                { label: 'ผู้รับผิดชอบ', value: project.assignee || '-', icon: 'manage_accounts' },
                { label: 'วันที่เริ่ม', value: project.startDate || '-', icon: 'play_circle' },
                { label: 'จำนวนรอบแก้', value: `${project.revisions} รอบ`, icon: 'refresh' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#7a8893', marginBottom: 4 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{item.icon}</span>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Brief */}
          {project.brief && (
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>description</span>
                Brief
              </div>
              <p style={{ fontSize: 13, color: '#5f6e7a', lineHeight: 1.7, margin: 0 }}>{project.brief}</p>
            </div>
          )}

          {/* Files */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>folder_zip</span>
              ไฟล์งาน
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', color: '#c8d4de', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 48 }}>cloud_upload</span>
              <div style={{ fontSize: 13, color: '#7a8893' }}>ยังไม่มีไฟล์</div>
              <button style={{ marginTop: 4, padding: '8px 16px', borderRadius: 8, border: '1.5px dashed #dde3e9', background: 'transparent', color: '#5f7d99', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                อัพโหลดไฟล์
              </button>
            </div>
          </div>
        </div>

        {/* Right - Financial */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>การเงิน</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>มูลค่างาน</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45' }}>{fmt(project.value)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>มัดจำที่รับแล้ว</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#3d8a64' }}>{fmt(project.deposit)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>ต้นทุน</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e07b54' }}>{fmt(project.cost)}</div>
              </div>
              <div style={{ paddingTop: 14, borderTop: '1px solid #edf0f3' }}>
                <div style={{ fontSize: 11, color: '#7a8893', marginBottom: 4 }}>กำไรโดยประมาณ</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: profit >= 0 ? '#3d8a64' : '#e05a4a' }}>
                  {fmt(profit)}
                </div>
                <div style={{ fontSize: 12, color: '#7a8893', marginTop: 2 }}>Margin {profitMargin}%</div>
              </div>
            </div>
          </div>

          {/* Customer Card */}
          {project.customer && (
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ข้อมูลลูกค้า</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#7a8893' }}>ชื่อ</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45' }}>{project.customer.name}</div>
                </div>
                {project.customer.company && (
                  <div>
                    <div style={{ fontSize: 11, color: '#7a8893' }}>บริษัท</div>
                    <div style={{ fontSize: 13, color: '#2f3b45' }}>{project.customer.company}</div>
                  </div>
                )}
                {project.customer.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5f7d99' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>call</span>
                    {project.customer.phone}
                  </div>
                )}
                {project.customer.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5f7d99' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>mail</span>
                    {project.customer.email}
                  </div>
                )}
                <Link
                  href={`/customers/${project.customer.id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5f7d99', textDecoration: 'none', fontWeight: 600, marginTop: 4 }}
                >
                  ดูโปรไฟล์ลูกค้า
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_forward</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
