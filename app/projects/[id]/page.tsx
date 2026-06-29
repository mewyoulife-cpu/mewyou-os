'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { computeChina, SHIP_METHODS } from '@/components/ChinaPackagingFields'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  lead: { label: 'Lead', bg: '#eef2f5', color: '#8fa7bc' },
  brief: { label: 'Brief', bg: '#e8f1f9', color: '#6b96c2' },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd' },
  payment: { label: 'Payment', bg: '#fdf3e3', color: '#f4a431' },
  design: { label: 'Design', bg: '#e8eef4', color: '#5f7d99' },
  revision: { label: 'Revision', bg: '#fceee8', color: '#e07b54' },
  approved: { label: 'Approved', bg: '#e9f3ed', color: '#3d8a64' },
  billing: { label: 'Billing', bg: '#fdeede', color: '#e08a2b' },
  deliver: { label: 'Deliver', bg: '#e3f2fd', color: '#2196f3' },
  completed: { label: 'Completed', bg: '#e8f5e9', color: '#4caf50' },
}

const STATUSES = ['lead', 'brief', 'quotation', 'payment', 'design', 'revision', 'approved', 'billing', 'deliver', 'completed']
const LABELS = ['Lead', 'Brief', 'Quotation', 'Payment', 'Design', 'Revision', 'Approved', 'Billing', 'Deliver', 'Completed']
const THAI_LABELS = [
  'รับงาน / เปิดโปรเจกต์',
  'รับ Brief จากลูกค้า',
  'จัดทำใบเสนอราคา',
  'รับชำระเงินมัดจำ',
  'ออกแบบงาน',
  'ส่ง Revision ให้ลูกค้า',
  'ลูกค้าอนุมัติงาน',
  'รอเรียกเก็บเงิน',
  'ส่งมอบงานให้ลูกค้า',
  'ปิดโปรเจกต์',
]

function fmtValue(n: number) {
  return '฿' + Math.round(n).toLocaleString('th-TH')
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
  chinaData?: string | null
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#7a8893', gap: 10 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 36, color: '#9aa7b2' }}>hourglass_empty</span>
        <span style={{ fontSize: 14, color: '#9aa7b2' }}>กำลังโหลด...</span>
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

  const currentStepIndex = STATUSES.indexOf(project.status)
  const s = STATUS_MAP[project.status] || { label: project.status, bg: '#f0f2f5', color: '#8a97a2' }

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 14px' }}>
        <Link href="/projects" style={{ color: '#9aa7b2', textDecoration: 'none' }}>โปรเจกต์ทั้งหมด</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500, fontFamily: "'IBM Plex Sans', sans-serif" }}>{project.code}</span>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        {/* Left */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45' }}>
              {project.customer?.name || project.name}
            </span>
            <span style={{
              display: 'inline-flex',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              background: s.bg,
              color: s.color,
            }}>
              {s.label}
            </span>
          </div>
          <div style={{ fontSize: 15, color: '#7a8893', marginTop: 4 }}>
            {project.name}{project.type ? ` · ${project.type}` : ''}
          </div>
        </div>
        {/* Right */}
        <div style={{ display: 'flex', gap: 9 }}>
          <button
            onClick={() => router.push(`/projects/${id}/edit`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 40,
              padding: '0 16px',
              border: '1px solid #e4e8ec',
              borderRadius: 10,
              fontSize: 13.5,
              color: '#5b6b77',
              fontWeight: 500,
              cursor: 'pointer',
              background: '#fff',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span>
            แก้ไขโปรเจกต์
          </button>
          <button
            style={{
              width: 40,
              height: 40,
              border: '1px solid #e4e8ec',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: '#fff',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5b6b77' }}>more_horiz</span>
          </button>
        </div>
      </div>

      {/* Main Row */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {/* Left Card — ข้อมูลโปรเจกต์ */}
        <div style={{ flex: '1 1 280px', background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>ข้อมูลโปรเจกต์</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'ลูกค้า', value: project.customer?.name ?? null },
              { label: 'ประเภทงาน', value: project.type ?? null },
              { label: 'ผู้รับผิดชอบ', value: project.assignee ?? null },
              { label: 'วันที่เริ่ม', value: project.startDate ?? null },
              { label: 'กำหนดส่ง', value: project.dueDate ?? null },
              { label: 'ความสำคัญ', value: project.priority ?? null },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#9aa7b2' }}>{row.label}</span>
                <span style={{ fontSize: 14, color: '#2f3b45', fontWeight: 500, textAlign: 'right' }}>
                  {row.value || '—'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: '#f0f2f5', margin: '20px 0' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#9aa7b2' }}>มูลค่างาน</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {fmtValue(project.value)}
            </span>
          </div>
        </div>

        {/* Right Card — ขั้นตอนการทำงาน */}
        <div style={{ flex: '1.3 1 360px', background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 20 }}>ขั้นตอนการทำงาน</div>
          <div>
            {STATUSES.map((step, i) => {
              const isPast = i < currentStepIndex
              const isCurrent = i === currentStepIndex
              const isFuture = i > currentStepIndex
              const isLast = i === STATUSES.length - 1
              const sm = STATUS_MAP[step]

              return (
                <div key={step} style={{ position: 'relative', display: 'flex', gap: 15, paddingBottom: isLast ? 0 : 18 }}>
                  {/* Vertical connector line */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute',
                      left: 16,
                      top: 34,
                      bottom: 0,
                      width: 2,
                      background: '#f0f2f5',
                      zIndex: 0,
                    }} />
                  )}
                  {/* Step dot */}
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                    background: isPast ? '#5f7d99' : isCurrent ? '#5f7d99' : '#f0f2f5',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(95,125,153,.2)' : undefined,
                  }}>
                    {isPast ? (
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#fff' }}>check</span>
                    ) : isCurrent ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{i + 1}</span>
                    ) : (
                      <span style={{ fontSize: 13, color: '#9aa7b2' }}>{i + 1}</span>
                    )}
                  </div>
                  {/* Step content */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 2 }}>
                    <div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: (isPast || isCurrent) ? 600 : undefined,
                        color: (isPast || isCurrent) ? '#2f3b45' : '#9aa7b2',
                      }}>
                        {LABELS[i]}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#9aa7b2', marginTop: 1 }}>{THAI_LABELS[i]}</div>
                    </div>
                    {isCurrent && (
                      <span style={{
                        display: 'inline-flex',
                        padding: '3px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background: sm.bg,
                        color: sm.color,
                        flexShrink: 0,
                      }}>
                        {sm.label}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* China packaging cost breakdown */}
      {project.chinaData && (() => {
        let d
        try { d = computeChina(JSON.parse(project.chinaData)) } catch { return null }
        const fmt = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2 })
        const rows: { label: string; value: number; highlight?: boolean; badge?: string }[] = [
          { label: '1. ต้นทุนเงินหยวน (¥/ชิ้น)', value: d.yuanCost },
          { label: '2. เรทเงิน (บาท/¥)', value: d.rate },
          { label: '3. ต้นทุนบาท/ชิ้น (฿)', value: d.bahtPerPiece },
          { label: '4. จำนวน MOQ (ชิ้น)', value: d.moq },
          { label: '5. ต้นทุนบาทรวม (฿)', value: d.bahtTotal },
          { label: '6. จำนวน Q (ลอต)', value: d.qty },
          { label: '7. ราคาขนส่งต่อ Q (฿)', value: d.shipRatePerQ },
          { label: '8. ราคารวมค่าขนส่ง (฿)', value: d.shipTotal },
          { label: '9. ต้นทุนขนส่ง/ชิ้น (฿)', value: d.shipPerUnit },
          { label: '10. ต้นทุนรวม (฿)', value: d.totalCost },
          { label: '11. ราคาขาย (฿/ชิ้น)', value: d.sellPrice },
          { label: '12. ราคาขายรวม (฿)', value: d.sellTotal },
          { label: '13. กำไรสุทธิ (฿)', value: d.netProfit, highlight: true, badge: `${d.netMarginPct >= 0 ? '+' : ''}${fmt(d.netMarginPct)}%` },
        ]
        return (
          <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22, marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17 }}>🇨🇳</span>
              <span style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>ข้อมูลต้นทุนผลิตแพคเกจจิ้งจีน</span>
              {(() => {
                const m = SHIP_METHODS.find(x => x.key === d.shipMethod)
                return m ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: '#e8eef4', color: '#5f7d99' }}>
                    {m.icon} {m.label}
                  </span>
                ) : null
              })()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
              {rows.map(r => {
                const neg = r.highlight && r.value < 0
                return (
                  <div key={r.label} style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: r.highlight ? (neg ? '#fceeec' : '#eef6f1') : '#f7f9fa',
                  }}>
                    <div style={{ fontSize: 12, color: '#9aa7b2', marginBottom: 5 }}>{r.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 17, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif",
                        color: r.highlight ? (neg ? '#d9534f' : '#3d8a64') : '#2f3b45',
                      }}>{fmt(r.value)}</span>
                      {r.badge && (
                        <span style={{
                          fontSize: 11.5, fontWeight: 700, padding: '2px 7px', borderRadius: 7,
                          background: neg ? '#f7d9d6' : '#d8ecdf', color: neg ? '#d9534f' : '#2f7a52',
                        }}>{r.badge}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* File Section */}
      <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22, marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>
            ไฟล์งาน{' '}
            <span style={{ fontSize: 13, color: '#9aa7b2', fontWeight: 400 }}>(0)</span>
          </div>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 38,
            padding: '0 15px',
            borderRadius: 10,
            background: '#5f7d99',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upload</span>
            อัปโหลด
          </button>
        </div>
        {/* Empty state */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '34px 0' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 40, color: '#cdd6df' }}>folder_open</span>
          <span style={{ fontSize: 13, color: '#9aa7b2' }}>ยังไม่มีไฟล์งาน · อัปโหลดได้หลังสร้างโปรเจกต์</span>
        </div>
      </div>
    </div>
  )
}
