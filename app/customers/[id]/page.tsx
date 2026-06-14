'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  code?: string
  name: string
  status: string
  value?: number
  createdAt?: string
}

interface Customer {
  id: string
  name: string
  company?: string
  type: 'vip' | 'new' | 'normal'
  phone?: string
  email?: string
  lineId?: string
  address?: string
  taxId?: string
  contact?: string
  notes?: string
  projects?: Project[]
  totalRevenue?: number
  totalPurchase?: number
  activeProjects?: number
}

const TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  vip: { label: 'VIP', bg: '#fdf3e3', color: '#f4a431' },
  new: { label: 'ลูกค้าใหม่', bg: '#e9f3ed', color: '#3d8a64' },
  normal: { label: 'ปกติ', bg: '#e8eef4', color: '#5f7d99' },
}

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

const TABS = ['ข้อมูลลูกค้า', 'โปรเจกต์', 'เอกสาร', 'ประวัติ', 'โน้ต']

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    if (!id) return
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(data => {
        setCustomer(data.customer || data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, color: '#9aa7b2' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>hourglass_empty</span>
        กำลังโหลด...
      </div>
    )
  }

  if (!customer) {
    return (
      <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 80 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>person_off</span>
        ไม่พบข้อมูลลูกค้า
        <br />
        <Link href="/customers" style={{ color: '#5f7d99', fontSize: 14, marginTop: 12, display: 'inline-block' }}>
          กลับไปรายการลูกค้า
        </Link>
      </div>
    )
  }

  const type = TYPE_MAP[customer.type] || TYPE_MAP.normal
  const projects = customer.projects ?? []
  const projectCount = projects.length
  const totalRevenue = customer.totalPurchase ?? customer.totalRevenue ?? 0
  const pendingCount = customer.activeProjects ?? projects.filter(p => p.status !== 'completed').length
  const recentProjects = projects.slice(0, 3)

  function formatDate(dateStr?: string) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 14px' }}>
        <Link href="/customers" style={{ color: '#9aa7b2', textDecoration: 'none' }}>ลูกค้าทั้งหมด</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500 }}>{customer.name}</span>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#54697d',
            fontSize: 21,
            background: 'linear-gradient(135deg,#eef2f6,#dde6ee)',
            fontFamily: "'IBM Plex Sans', sans-serif",
            flexShrink: 0,
          }}>
            {customer.name.charAt(0).toUpperCase()}
          </div>
          {/* Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>{customer.name}</span>
              <span style={{
                display: 'inline-flex',
                background: type.bg,
                color: type.color,
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 20,
              }}>
                {type.label}
              </span>
            </div>
            {customer.company && (
              <div style={{ fontSize: 14, color: '#7a8893', marginTop: 2 }}>{customer.company}</div>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => router.push(`/customers/${id}/edit`)}
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
            fontFamily: 'inherit',
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 17 }}>edit</span>
          แก้ไขข้อมูลลูกค้า
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid #eaedf0', marginBottom: 20 }}>
        {TABS.map((tab, i) => {
          const key = ['info', 'projects', 'documents', 'history', 'notes'][i]
          const isActive = activeTab === key
          return (
            <div
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                paddingBottom: 10,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#5f7d99' : '#9aa7b2',
                borderBottom: isActive ? '2px solid #5f7d99' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {tab}
            </div>
          )
        })}
      </div>

      {activeTab === 'info' && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            {/* ยอดซื้อทั้งหมด */}
            <div style={{ flex: '1 1 200px', background: '#ffffff', borderRadius: 16, border: '1px solid #edf0f3', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#e8eef4', color: '#5f7d99' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>payments</span>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#7a8893' }}>ยอดซื้อทั้งหมด</div>
                <div style={{ fontSize: 25, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  ฿{Math.round(totalRevenue).toLocaleString('th-TH')}
                </div>
              </div>
            </div>

            {/* โปรเจกต์ทั้งหมด */}
            <div style={{ flex: '1 1 200px', background: '#ffffff', borderRadius: 16, border: '1px solid #edf0f3', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#e9f3ed', color: '#3d8a64' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>folder_open</span>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#7a8893' }}>โปรเจกต์ทั้งหมด</div>
                <div style={{ fontSize: 25, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {projectCount} <span style={{ fontSize: 14, fontWeight: 400 }}>งาน</span>
                </div>
              </div>
            </div>

            {/* ค้างส่ง */}
            <div style={{ flex: '1 1 200px', background: '#ffffff', borderRadius: 16, border: '1px solid #edf0f3', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#fdf3e3', color: '#f4a431' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>schedule</span>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#7a8893' }}>ค้างส่ง</div>
                <div style={{ fontSize: 25, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {pendingCount} <span style={{ fontSize: 14, fontWeight: 400 }}>งาน</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content 2-col */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {/* Left Card: ข้อมูลลูกค้า */}
            <div style={{ flex: '1 1 320px', background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>ข้อมูลลูกค้า</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {[
                  { key: 'ผู้ติดต่อ', value: customer.contact },
                  { key: 'เบอร์โทร', value: customer.phone },
                  { key: 'อีเมล', value: customer.email },
                  { key: 'Line ID', value: customer.lineId },
                  { key: 'ที่อยู่', value: customer.address },
                  { key: 'เลขผู้เสียภาษี', value: customer.taxId },
                ].map(({ key, value }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 18 }}>
                    <span style={{ fontSize: 13, color: '#9aa7b2', flexShrink: 0 }}>{key}</span>
                    <span style={{ fontSize: 13.5, color: '#2f3b45', fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Sub-card: โปรเจกต์ล่าสุด */}
              <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>โปรเจกต์ล่าสุด</span>
                  <Link href={`/customers/${customer.id}/projects`} style={{ fontSize: 13, color: '#4f7bb0', textDecoration: 'none' }}>ดูทั้งหมด</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentProjects.length === 0 ? (
                    <div style={{ fontSize: 13.5, color: '#9aa7b2', textAlign: 'center', padding: '20px 0' }}>ยังไม่มีโปรเจกต์</div>
                  ) : recentProjects.map(project => {
                    const status = STATUS_MAP[project.status] || { label: project.status, bg: '#eef2f5', color: '#8fa7bc' }
                    return (
                      <div key={project.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 11, border: '1px solid #f0f2f5', cursor: 'pointer' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {project.code && (
                            <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{project.code}</div>
                          )}
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
                        </div>
                        <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: status.bg, color: status.color, flexShrink: 0 }}>
                          {status.label}
                        </span>
                        <span style={{ fontSize: 12.5, color: '#9aa7b2', width: 64, textAlign: 'right', flexShrink: 0 }}>
                          {formatDate(project.createdAt)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sub-card: โน้ตลูกค้า */}
              <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>โน้ตลูกค้า</span>
                  <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9aa7b2', cursor: 'pointer' }}>edit</span>
                </div>
                <div style={{ background: '#f9f6ef', border: '1px solid #f0e9d8', borderRadius: 12, padding: '14px 16px', fontSize: 13.5, color: '#6b6452', lineHeight: 1.6 }}>
                  {customer.notes || 'ยังไม่มีโน้ต'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'projects' && (
        <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>โปรเจกต์ทั้งหมด</div>
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 40 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>folder_off</span>
              ยังไม่มีโปรเจกต์
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.map(project => {
                const status = STATUS_MAP[project.status] || { label: project.status, bg: '#eef2f5', color: '#8fa7bc' }
                return (
                  <div key={project.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 11, border: '1px solid #f0f2f5', cursor: 'pointer' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {project.code && (
                        <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{project.code}</div>
                      )}
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45', marginTop: 1 }}>{project.name}</div>
                    </div>
                    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                    <span style={{ fontSize: 12.5, color: '#9aa7b2', width: 64, textAlign: 'right', flexShrink: 0 }}>
                      {formatDate(project.createdAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>description</span>
          ยังไม่มีเอกสาร
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>history</span>
          ยังไม่มีประวัติ
        </div>
      )}

      {activeTab === 'notes' && (
        <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>โน้ตลูกค้า</span>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9aa7b2', cursor: 'pointer' }}>edit</span>
          </div>
          <div style={{ background: '#f9f6ef', border: '1px solid #f0e9d8', borderRadius: 12, padding: '14px 16px', fontSize: 13.5, color: '#6b6452', lineHeight: 1.6 }}>
            {customer.notes || 'ยังไม่มีโน้ต'}
          </div>
        </div>
      )}
    </div>
  )
}
