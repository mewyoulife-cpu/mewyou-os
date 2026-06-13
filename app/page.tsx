export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DashboardCharts from './DashboardCharts'

function fmt(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtShort(n: number) {
  return '฿' + n.toLocaleString('th-TH')
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  lead:      { label: 'Lead',      bg: '#eef2f5', color: '#8fa7bc' },
  brief:     { label: 'Brief',     bg: '#e8f1f9', color: '#6b96c2' },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd' },
  payment:   { label: 'Payment',   bg: '#fdf3e3', color: '#f4a431' },
  design:    { label: 'ออกแบบ',    bg: '#e8eef4', color: '#5f7d99' },
  revision:  { label: 'Revision',  bg: '#fceee8', color: '#e07b54' },
  approved:  { label: 'รออนุมัติ', bg: '#e9f3ed', color: '#3d8a64' },
  deliver:   { label: 'รอส่งมอบ', bg: '#e3f2fd', color: '#2196f3' },
  completed: { label: 'เสร็จสิ้น', bg: '#e8f5e9', color: '#4caf50' },
}

const STATUS_PROGRESS: Record<string, number> = {
  lead: 5, brief: 15, quotation: 25, payment: 35,
  design: 55, revision: 70, approved: 82, deliver: 92, completed: 100,
}

function getThaiBuddhistDate(date: Date): string {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ]
  const dayName = days[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear() + 543
  return `วัน${dayName}ที่ ${day} ${month} ${year}`
}

function getWeekDays(today: Date) {
  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  const labels = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { label: labels[i], date: d.getDate(), isToday: d.toDateString() === today.toDateString() }
  })
}

export default async function DashboardPage() {
  const today = new Date()

  const [
    projectCount,
    projects,
    inProgressCount,
    deliverCount,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.project.count({
      where: { status: { notIn: ['completed', 'lead', 'deliver'] } },
    }),
    prisma.project.count({
      where: { status: 'deliver' },
    }),
  ])

  // Monthly sales sum (current month)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const allProjectsThisMonth = await prisma.project.findMany({
    where: {
      status: { in: ['payment', 'design', 'revision', 'approved', 'deliver', 'completed'] },
      createdAt: { gte: new Date(startOfMonth) },
    },
    select: { value: true, deposit: true },
  })
  const monthlySales = allProjectsThisMonth.reduce((s, p) => s + p.value, 0)

  // Pending invoices (documents with status draft/pending)
  const pendingDocs = await prisma.document.findMany({
    where: { type: 'invoice', status: { in: ['draft', 'pending', 'sent'] } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { no: true, clientName: true, issueDate: true, items: true, discount: true, vatEnabled: true },
  })

  // Outstanding (overdue) — sum of pending documents
  const allPendingDocs = await prisma.document.findMany({
    where: { type: 'invoice', status: { in: ['draft', 'pending', 'sent'] } },
    select: { items: true, discount: true, vatEnabled: true },
  })

  function calcTotal(items: string, discount: number, vatEnabled: boolean) {
    try {
      const parsed = JSON.parse(items) as Array<{ qty: number; unitPrice: number }>
      const subtotal = parsed.reduce((s, it) => s + (it.qty || 1) * (it.unitPrice || 0), 0)
      const afterDiscount = subtotal - discount
      return vatEnabled ? afterDiscount * 1.07 : afterDiscount
    } catch {
      return 0
    }
  }

  const outstandingTotal = allPendingDocs.reduce(
    (s, d) => s + calcTotal(d.items, d.discount, d.vatEnabled),
    0,
  )

  // Donut chart data from real project statuses
  const statusGroups = await prisma.project.groupBy({ by: ['status'], _count: true })
  const donutData = [
    { label: 'ออกแบบ',   value: statusGroups.find(g => g.status === 'design')?.['_count'] ?? 0,    color: '#2f3b45' },
    { label: 'ผลิต',     value: statusGroups.find(g => g.status === 'revision')?.['_count'] ?? 0,  color: '#5f7d99' },
    { label: 'รออนุมัติ', value: statusGroups.find(g => g.status === 'approved')?.['_count'] ?? 0, color: '#3d8a64' },
    { label: 'รอผลิต',   value: statusGroups.find(g => g.status === 'brief')?.['_count'] ?? 0,     color: '#b0bdc8' },
    { label: 'เสร็จสิ้น', value: statusGroups.find(g => g.status === 'completed')?.['_count'] ?? 0, color: '#c4a882' },
  ]

  const todayStr = getThaiBuddhistDate(today)
  const weekDays = getWeekDays(today)

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #edf0f3',
    padding: '20px 22px',
  }

  const statCards = [
    {
      icon: 'folder',
      label: 'โปรเจกต์ทั้งหมด',
      value: String(projectCount),
      trend: '↑ 12% จากเดือนที่แล้ว',
      trendUp: true,
    },
    {
      icon: 'timer',
      label: 'กำลังดำเนินการ',
      value: String(inProgressCount),
      trend: '↑ 8% จากเดือนที่แล้ว',
      trendUp: true,
    },
    {
      icon: 'check_circle',
      label: 'รอส่งมอบ',
      value: String(deliverCount),
      trend: '↓ 3% จากเดือนที่แล้ว',
      trendUp: false,
    },
    {
      icon: 'payments',
      label: 'ยอดขายรวม (เดือนนี้)',
      value: monthlySales > 0 ? fmtShort(monthlySales) : '฿0',
      trend: '↑ 15% จากเดือนที่แล้ว',
      trendUp: true,
    },
    {
      icon: 'credit_card',
      label: 'ยอดค้างชำระ',
      value: outstandingTotal > 0 ? fmtShort(Math.round(outstandingTotal)) : '฿0',
      trend: '↓ 5% จากเดือนที่แล้ว',
      trendUp: false,
    },
  ]

  const salesData = [65000, 78000, 72000, 85000, 92000, 455000]
  const salesMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.']

  const SCHEDULE = [
    { time: '09:00', text: 'Brief NATURE PLUS', color: '#5f7d99' },
    { time: '13:00', text: 'Revision JELLYS รอบ 2', color: '#e07b54' },
    { time: '15:30', text: 'ส่งงาน GLOWME', color: '#3d8a64' },
  ]

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* TOP HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span
            className="material-symbols-rounded"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#b0bdc8', pointerEvents: 'none' }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="ค้นหาโปรเจกต์, ลูกค้า, เลขที่เอกสาร..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: 10,
              border: '1px solid #edf0f3',
              background: '#fff',
              fontSize: 13,
              color: '#2f3b45',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {/* Notification Bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 10,
            border: '1px solid #edf0f3',
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#7a8893' }}>notifications</span>
          </div>
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#f4831f',
            color: '#fff',
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 700,
            minWidth: 17,
            height: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            5
          </div>
        </div>
        {/* Create Button */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#2f3b45',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
          สร้างใหม่
        </button>
      </div>

      {/* GREETING SECTION */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2f3b45', margin: 0, lineHeight: 1.2 }}>
          สวัสดี, Mew 👋
        </h1>
        <div style={{ fontSize: 14, color: '#7a8893', marginTop: 6 }}>
          ยินดีต้อนรับเข้าสู่ระบบ Mewyou Design OS · {todayStr}
        </div>
      </div>

      {/* 5 STAT CARDS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {statCards.map((k) => (
          <div key={k.label} style={{
            flex: '1 1 0',
            minWidth: 160,
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #edf0f3',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7a8893', fontSize: 12, fontWeight: 500, marginBottom: 12 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>{k.icon}</span>
              {k.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#2f3b45', lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.trendUp ? '#3d8a64' : '#e05a4a', marginTop: 6 }}>
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT: 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '35% 35% 30%', gap: 16, marginBottom: 24 }}>

        {/* LEFT: Donut Chart */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>ภาพรวมโปรเจกต์</div>
          <DashboardCharts
            donutData={donutData}
            salesData={salesData}
            salesMonths={salesMonths}
            mode="donut"
          />
        </div>

        {/* MIDDLE: Line Chart */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>ยอดขาย (6 เดือนล่าสุด)</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: '#7a8893', cursor: 'pointer',
              border: '1px solid #edf0f3', borderRadius: 6, padding: '3px 8px',
            }}>
              บาท <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_drop_down</span>
            </div>
          </div>
          <DashboardCharts
            donutData={donutData}
            salesData={salesData}
            salesMonths={salesMonths}
            mode="line"
          />
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ใบกำกับภาษีรอส่ง */}
          <div style={{ ...card, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>ใบกำกับภาษีรอส่ง</div>
              <Link href="/documents" style={{ fontSize: 12, color: '#5f7d99', textDecoration: 'none' }}>ดูทั้งหมด</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingDocs.length > 0 ? pendingDocs.map((doc) => {
                const total = calcTotal(doc.items, doc.discount, doc.vatEnabled)
                return (
                  <div key={doc.no} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    borderLeft: '3px solid #6c63ff',
                    background: '#fafaff',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#2f3b45', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.clientName || '-'}
                      </div>
                      <div style={{ fontSize: 11, color: '#7a8893' }}>{doc.no} · {doc.issueDate}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#2f3b45', whiteSpace: 'nowrap' }}>
                      {fmtShort(Math.round(total))}
                    </div>
                  </div>
                )
              }) : (
                [
                  { name: 'LUXE CO., LTD.', no: 'TAX-2025-001', date: '20/05/68', amount: 53500 },
                  { name: 'GLOWME',         no: 'TAX-2025-002', date: '19/05/68', amount: 47500 },
                  { name: 'PERCARE',        no: 'TAX-2025-003', date: '18/05/68', amount: 32100 },
                ].map((inv) => (
                  <div key={inv.no} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    borderLeft: '3px solid #6c63ff',
                    background: '#fafaff',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#2f3b45' }}>{inv.name}</div>
                      <div style={{ fontSize: 11, color: '#7a8893' }}>{inv.no} · {inv.date}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#2f3b45', whiteSpace: 'nowrap' }}>
                      {fmtShort(inv.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ปฏิทินงานวันนี้ */}
          <div style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45', marginBottom: 14 }}>ปฏิทินงานวันนี้</div>
            {/* Week days */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              {weekDays.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 10, color: '#7a8893' }}>{d.label}</div>
                  <div style={{
                    width: 26, height: 26,
                    borderRadius: '50%',
                    background: d.isToday ? '#2f3b45' : 'transparent',
                    color: d.isToday ? '#fff' : '#2f3b45',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: d.isToday ? 700 : 400,
                  }}>
                    {d.date}
                  </div>
                </div>
              ))}
            </div>
            {/* Schedule items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SCHEDULE.map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ev.color, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: '#7a8893' }}>{ev.time}</div>
                    <div style={{ fontSize: 12, color: '#2f3b45', fontWeight: 500 }}>{ev.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM: Recent Projects Table */}
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>โปรเจกต์ล่าสุด</div>
          <Link href="/projects" style={{ fontSize: 13, color: '#5f7d99', textDecoration: 'none', fontWeight: 500 }}>ดูทั้งหมด &gt;</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                {['รหัสโปรเจกต์', 'ชื่อลูกค้า', 'ประเภท', 'สถานะ', 'ความคืบหน้า', 'กำหนดส่ง', 'มูลค่า'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#7a8893', fontWeight: 500, whiteSpace: 'nowrap', fontSize: 12 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#7a8893' }}>
                    ยังไม่มีโปรเจกต์
                  </td>
                </tr>
              ) : projects.map((p) => {
                const s = STATUS_MAP[p.status] || { label: p.status, bg: '#f0f2f5', color: '#8a97a2' }
                const pct = STATUS_PROGRESS[p.status] || 0
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f4f6f8' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#5f7d99' }}>
                      <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none', color: '#5f7d99' }}>{p.code}</Link>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#2f3b45' }}>{p.customer?.name || '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#7a8893' }}>{p.type}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        height: 24, padding: '0 10px',
                        borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: s.bg, color: s.color,
                      }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', minWidth: 110 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#edf0f3', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#5f7d99', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#7a8893', width: 30 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#7a8893', whiteSpace: 'nowrap' }}>{p.dueDate || '-'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2f3b45', whiteSpace: 'nowrap' }}>{fmt(p.value)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
