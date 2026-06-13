'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
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
  activeProjects?: number
}

const typeMap = {
  vip: { label: 'VIP', bg: '#fdf3e3', color: '#f4a431' },
  new: { label: 'ใหม่', bg: '#e9f3ed', color: '#3d8a64' },
  normal: { label: 'ปกติ', bg: '#e8eef4', color: '#5f7d99' },
}

const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'กำลังดำเนินการ', bg: '#e8eef4', color: '#5f7d99' },
  completed: { label: 'เสร็จสิ้น', bg: '#e9f3ed', color: '#3d8a64' },
  pending: { label: 'รอดำเนินการ', bg: '#fdf3e3', color: '#f4a431' },
  cancelled: { label: 'ยกเลิก', bg: '#fceee8', color: '#c4593f' },
}

const gradients = [
  'linear-gradient(135deg, #5f7d99, #3d5a73)',
  'linear-gradient(135deg, #3d8a64, #2a6347)',
  'linear-gradient(135deg, #f4a431, #d4841a)',
  'linear-gradient(135deg, #7c6fab, #5c4f8b)',
  'linear-gradient(135deg, #c4593f, #a03a25)',
]

function getGradient(name: string) {
  return gradients[name.charCodeAt(0) % gradients.length]
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function formatMoney(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const tabs = ['ข้อมูลทั่วไป', 'โปรเจกต์', 'ใบเสนอราคา', 'โน้ต']

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

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
      <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 80 }}>
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

  const type = typeMap[customer.type] || typeMap.normal
  const projectCount = customer.projects?.length ?? 0
  const activeCount = customer.activeProjects ?? customer.projects?.filter(p => p.status === 'active').length ?? 0
  const totalRevenue = customer.totalRevenue ?? 0

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Link href="/customers" style={{ color: '#7a8893', textDecoration: 'none', fontSize: 13 }}>ลูกค้าทั้งหมด</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>chevron_right</span>
        <span style={{ fontSize: 13, color: '#2f3b45', fontWeight: 600 }}>{customer.name}</span>
      </div>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, #4a6b85 0%, #2f4a5e 100%)',
        borderRadius: 18,
        padding: '28px 28px 0',
        marginBottom: 16,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: 20, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: getGradient(customer.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 22,
            border: '3px solid rgba(255,255,255,0.2)',
            flexShrink: 0,
          }}>
            {getInitials(customer.name)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>{customer.name}</h1>
              <span style={{
                background: type.bg, color: type.color,
                borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700,
              }}>
                {type.label}
              </span>
            </div>
            {customer.company && (
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>{customer.company}</p>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '14px 14px 0 0',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}>
          {[
            { label: 'โปรเจกต์ทั้งหมด', value: projectCount, unit: 'งาน', icon: 'folder' },
            { label: 'ยอดซื้อรวม', value: formatMoney(totalRevenue), unit: '', icon: 'payments' },
            { label: 'โปรเจกต์ที่ดำเนินการ', value: activeCount, unit: 'งาน', icon: 'work' },
          ].map((kpi, i) => (
            <div key={i} style={{
              padding: '16px 20px',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                {kpi.value}{kpi.unit && <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>{kpi.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #edf0f3',
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #edf0f3' }}>
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '14px 20px',
                border: 'none',
                background: 'none',
                fontSize: 14,
                fontWeight: activeTab === i ? 700 : 400,
                color: activeTab === i ? '#5f7d99' : '#7a8893',
                cursor: 'pointer',
                borderBottom: activeTab === i ? '2px solid #5f7d99' : '2px solid transparent',
                marginBottom: -1,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ padding: 22 }}>
          {/* Tab: ข้อมูลทั่วไป */}
          {activeTab === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'ชื่อลูกค้า / แบรนด์', value: customer.name, icon: 'badge' },
                { label: 'บริษัท / ร้านค้า', value: customer.company || '-', icon: 'business' },
                { label: 'ผู้ติดต่อ', value: customer.contact || '-', icon: 'person' },
                { label: 'เบอร์โทร', value: customer.phone || '-', icon: 'call' },
                { label: 'อีเมล', value: customer.email || '-', icon: 'mail' },
                { label: 'Line ID', value: customer.lineId || '-', icon: 'chat' },
                { label: 'เลขผู้เสียภาษี', value: customer.taxId || '-', icon: 'receipt' },
                { label: 'ประเภทลูกค้า', value: type.label, icon: 'star' },
              ].map((field, i) => (
                <div key={i} style={{
                  padding: '14px 16px',
                  background: '#f9fafb',
                  borderRadius: 10,
                  border: '1px solid #edf0f3',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#9aa7b2' }}>{field.icon}</span>
                    <span style={{ fontSize: 12, color: '#9aa7b2', fontWeight: 500 }}>{field.label}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#2f3b45', fontWeight: 500 }}>{field.value}</div>
                </div>
              ))}
              {customer.address && (
                <div style={{
                  padding: '14px 16px',
                  background: '#f9fafb',
                  borderRadius: 10,
                  border: '1px solid #edf0f3',
                  gridColumn: '1 / -1',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#9aa7b2' }}>location_on</span>
                    <span style={{ fontSize: 12, color: '#9aa7b2', fontWeight: 500 }}>ที่อยู่</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#2f3b45', lineHeight: 1.6 }}>{customer.address}</div>
                </div>
              )}
              {customer.notes && (
                <div style={{
                  padding: '14px 16px',
                  background: '#fffbf0',
                  borderRadius: 10,
                  border: '1px solid #fde8b4',
                  gridColumn: '1 / -1',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#f4a431' }}>sticky_note_2</span>
                    <span style={{ fontSize: 12, color: '#9aa7b2', fontWeight: 500 }}>หมายเหตุ</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#2f3b45', lineHeight: 1.6 }}>{customer.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* Tab: โปรเจกต์ */}
          {activeTab === 1 && (
            <div>
              {!customer.projects || customer.projects.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 40 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>folder_off</span>
                  ยังไม่มีโปรเจกต์
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {customer.projects.map(project => {
                    const status = statusMap[project.status] || statusMap.pending
                    return (
                      <div key={project.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        background: '#f9fafb',
                        borderRadius: 10,
                        border: '1px solid #edf0f3',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>folder</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>{project.name}</div>
                            {project.createdAt && (
                              <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 2 }}>{project.createdAt}</div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {project.value && (
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>{formatMoney(project.value)}</span>
                          )}
                          <span style={{
                            background: status.bg, color: status.color,
                            borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                          }}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: ใบเสนอราคา */}
          {activeTab === 2 && (
            <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 40 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>description</span>
              ยังไม่มีใบเสนอราคา
            </div>
          )}

          {/* Tab: โน้ต */}
          {activeTab === 3 && (
            <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 40 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>sticky_note_2</span>
              ยังไม่มีโน้ต
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
