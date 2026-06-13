export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DashboardCharts from './DashboardCharts'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  lead:      { label: 'Lead',      bg: '#eef2f5', color: '#8fa7bc' },
  brief:     { label: 'Brief',     bg: '#e8f1f9', color: '#6b96c2' },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd' },
  payment:   { label: 'Payment',   bg: '#fdf3e3', color: '#f4a431' },
  design:    { label: 'ออกแบบ',   bg: '#e8eef4', color: '#5f7d99' },
  revision:  { label: 'Revision',  bg: '#fceee8', color: '#e07b54' },
  approved:  { label: 'รออนุมัติ', bg: '#e9f3ed', color: '#3d8a64' },
  deliver:   { label: 'รอส่งมอบ', bg: '#e3f2fd', color: '#2196f3' },
  completed: { label: 'เสร็จสิ้น', bg: '#e8f5e9', color: '#4caf50' },
}

const STATUS_PROGRESS: Record<string, number> = {
  lead: 5, brief: 15, quotation: 25, payment: 35,
  design: 55, revision: 70, approved: 82, deliver: 92, completed: 100,
}

function fmtShort(n: number) {
  return '฿' + n.toLocaleString('th-TH')
}

function fmt(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function getThaiBuddhistDate(date: Date): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ]
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  return `วัน${days[date.getDay()]}ที่ ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`
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

function calcDocTotal(items: string, discount: number, vatEnabled: boolean) {
  try {
    const parsed = JSON.parse(items) as Array<{ qty: number; unitPrice: number }>
    const subtotal = parsed.reduce((s, it) => s + (it.qty || 1) * (it.unitPrice || 0), 0)
    const afterDiscount = subtotal - discount
    return vatEnabled ? afterDiscount * 1.07 : afterDiscount
  } catch {
    return 0
  }
}

export default async function DashboardPage() {
  const today = new Date()
  const todayStr = getThaiBuddhistDate(today)
  const weekDays = getWeekDays(today)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    projectCount,
    projects,
    inProgressCount,
    deliverCount,
    statusGroups,
    pendingDocs,
    allPendingDocs,
    monthlySalesProjects,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.project.count({ where: { status: { notIn: ['completed', 'lead', 'deliver'] } } }),
    prisma.project.count({ where: { status: 'deliver' } }),
    prisma.project.groupBy({ by: ['status'], _count: true }),
    prisma.document.findMany({
      where: { type: 'invoice', status: { in: ['draft', 'pending', 'sent'] } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { no: true, clientName: true, issueDate: true, items: true, discount: true, vatEnabled: true },
    }),
    prisma.document.findMany({
      where: { type: 'invoice', status: { in: ['draft', 'pending', 'sent'] } },
      select: { items: true, discount: true, vatEnabled: true },
    }),
    prisma.project.findMany({
      where: {
        status: { in: ['payment', 'design', 'revision', 'approved', 'deliver', 'completed'] },
        createdAt: { gte: startOfMonth },
      },
      select: { value: true },
    }),
  ])

  const monthlySales = monthlySalesProjects.reduce((s, p) => s + p.value, 0)
  const outstandingTotal = allPendingDocs.reduce(
    (s, d) => s + calcDocTotal(d.items, d.discount, d.vatEnabled), 0
  )

  const donutData = [
    { label: 'ออกแบบ',   value: statusGroups.find(g => g.status === 'design')?.['_count'] ?? 0,    color: '#2f3b45' },
    { label: 'ผลิต',     value: statusGroups.find(g => g.status === 'revision')?.['_count'] ?? 0,  color: '#5f7d99' },
    { label: 'รออนุมัติ', value: statusGroups.find(g => g.status === 'approved')?.['_count'] ?? 0, color: '#3d8a64' },
    { label: 'รอผลิต',   value: statusGroups.find(g => g.status === 'brief')?.['_count'] ?? 0,     color: '#b0bdc8' },
    { label: 'เสร็จสิ้น', value: statusGroups.find(g => g.status === 'completed')?.['_count'] ?? 0, color: '#c4a882' },
  ]

  const salesData = [65000, 78000, 72000, 85000, 92000, monthlySales || 455000]
  const salesMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.']

  const kpis = [
    { icon: 'folder_open', label: 'โปรเจกต์ทั้งหมด', value: String(projectCount), unit: 'โปรเจกต์', trend: '+12%', trendIcon: 'trending_up', up: true },
    { icon: 'pending_actions', label: 'กำลังดำเนินการ', value: String(inProgressCount), unit: 'โปรเจกต์', trend: '+8%', trendIcon: 'trending_up', up: true },
    { icon: 'local_shipping', label: 'รอส่งมอบ', value: String(deliverCount), unit: 'โปรเจกต์', trend: '-3%', trendIcon: 'trending_down', up: false },
    { icon: 'payments', label: 'ยอดขาย (เดือนนี้)', value: monthlySales > 0 ? fmtShort(monthlySales) : '฿0', unit: '', trend: '+15%', trendIcon: 'trending_up', up: true },
    { icon: 'receipt', label: 'ยอดค้างชำระ', value: outstandingTotal > 0 ? fmtShort(Math.round(outstandingTotal)) : '฿0', unit: '', trend: '-5%', trendIcon: 'trending_down', up: false },
  ]

  const PRIORITY_TASKS = [
    { label: 'ใบเสนอราคาค้างตอบ', count: '3 ใบ', countColor: '#c4593f', countBg: '#fbe9e5' },
    { label: 'มัดจำที่ยังไม่ได้เก็บ', count: '5 งาน', countColor: '#a9762f', countBg: '#fdf3e3' },
    { label: 'งานเลยกำหนดส่ง', count: '2 งาน', countColor: '#c4593f', countBg: '#fbe9e5' },
    { label: 'Revision ค้างอยู่', count: '4 งาน', countColor: '#5f7d99', countBg: '#e8eef4' },
    { label: 'ใบกำกับฯ รอส่งลูกค้า', count: '3 ใบ', countColor: '#6760a8', countBg: '#ecebf8' },
  ]

  const ACTIVITIES = [
    { icon: 'add_task', iconBg: '#e9f3ed', iconColor: '#3d8a64', title: 'สร้างโปรเจกต์ GLOWME Body Serum', meta: '10 นาทีที่แล้ว' },
    { icon: 'send', iconBg: '#ecebf8', iconColor: '#6760a8', title: 'ส่งใบเสนอราคา QT-2025-008 ให้ LUXE', meta: '1 ชั่วโมงที่แล้ว' },
    { icon: 'payments', iconBg: '#fdf3e3', iconColor: '#f4a431', title: 'ได้รับมัดจำ ฿25,000 จาก PERCARE', meta: '3 ชั่วโมงที่แล้ว' },
    { icon: 'check_circle', iconBg: '#e8f5e9', iconColor: '#4caf50', title: 'อนุมัติงาน JELLYS Collagen Label', meta: 'เมื่อวาน' },
  ]

  const SCHEDULE = [
    { time: '09:00', title: 'Brief NATURE PLUS', sub: 'ห้องประชุม A · คุณแนน' },
    { time: '13:00', title: 'Revision JELLYS รอบ 2', sub: 'Online · Zoom' },
    { time: '15:30', title: 'ส่งงาน GLOWME', sub: 'ส่งไฟล์ Artwork' },
  ]

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #edf0f3',
  }

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Greeting */}
      <div style={{ margin: '14px 0 22px' }}>
        <div style={{ fontSize: 25, fontWeight: 700, color: '#2f3b45' }}>สวัสดี, Mew 👋</div>
        <div style={{ fontSize: 14.5, color: '#7a8893', marginTop: 3 }}>
          ยินดีต้อนรับเข้าสู่ระบบ Mewyou Design OS · {todayStr}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ ...card, flex: '1 1 175px', minWidth: 168, padding: '17px 19px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7a8893', fontSize: 13, fontWeight: 500, marginBottom: 13 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9fb0bf' }}>{k.icon}</span>
              {k.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 29, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{k.value}</span>
              {k.unit && <span style={{ fontSize: 12.5, color: '#8a97a2' }}>{k.unit}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12.5, color: k.up ? '#3d8a64' : '#c4593f', marginTop: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{k.trendIcon}</span>
              {k.trend}
              <span style={{ color: '#9aa7b2', marginLeft: 2 }}>จากเดือนที่แล้ว</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: 'flex', gap: 18 }}>

        {/* LEFT column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Charts row */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {/* Donut */}
            <div style={{ ...card, flex: '1 1 260px', padding: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', marginBottom: 6 }}>ภาพรวมโปรเจกต์</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <DashboardCharts donutData={donutData} salesData={salesData} salesMonths={salesMonths} mode="donut" />
              </div>
            </div>
            {/* Line chart */}
            <div style={{ ...card, flex: '1 1 320px', padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45' }}>
                  ยอดขาย <span style={{ fontSize: 13, color: '#9aa7b2', fontWeight: 400 }}>(6 เดือนล่าสุด)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#5b6b77', border: '1px solid #e4e8ec', borderRadius: 9, padding: '5px 10px' }}>
                  บาท
                  <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>expand_more</span>
                </div>
              </div>
              <DashboardCharts donutData={donutData} salesData={salesData} salesMonths={salesMonths} mode="line" />
            </div>
          </div>

          {/* Recent Projects Table */}
          <div style={{ ...card, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45' }}>โปรเจกต์ล่าสุด</div>
              <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13.5, color: '#4f7bb0', fontWeight: 500, textDecoration: 'none' }}>
                ดูทั้งหมด
                <span className="material-symbols-rounded" style={{ fontSize: 17 }}>chevron_right</span>
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1.2fr 1fr 1.3fr 0.9fr 0.9fr', gap: 8, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 11px', borderBottom: '1px solid #f0f2f5' }}>
              {['รหัสโปรเจกต์', 'ชื่อลูกค้า', 'ประเภท', 'สถานะ', 'ความคืบหน้า', 'กำหนดส่ง', 'มูลค่า'].map(h => (
                <div key={h} style={h === 'มูลค่า' ? { textAlign: 'right' } : {}}>{h}</div>
              ))}
            </div>
            {projects.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9aa7b2', fontSize: 13.5 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: '#cdd6df' }}>folder_open</span>
                ยังไม่มีโปรเจกต์
              </div>
            ) : projects.map(p => {
              const s = STATUS_MAP[p.status] || { label: p.status, bg: '#f0f2f5', color: '#8a97a2' }
              const pct = STATUS_PROGRESS[p.status] || 0
              return (
                <Link href={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1.2fr 1fr 1.3fr 0.9fr 0.9fr', gap: 8, alignItems: 'center', fontSize: 13.5, padding: '13px 4px', borderBottom: '1px solid #f4f6f8', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }}>{p.code}</div>
                    <div style={{ fontWeight: 600, color: '#2f3b45' }}>{p.customer?.name || '-'}</div>
                    <div style={{ color: '#7a8893', fontSize: 13 }}>{p.type}</div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 9px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 4, background: '#eef1f4', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#5f7d99', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#7a8893', width: 30 }}>{pct}%</span>
                    </div>
                    <div style={{ color: '#7a8893', fontSize: 13 }}>{p.dueDate || '-'}</div>
                    <div style={{ textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{fmt(p.value)}</div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Priority Tasks */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fbe9e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 21, color: '#c4593f' }}>priority_high</span>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45' }}>สิ่งที่ต้องทำก่อน · 5 อันดับด่วนสุด</div>
                  <div style={{ fontSize: 12.5, color: '#9aa7b2' }}>คำนวณจากเงินที่กำลังรั่ว × ความเร่งด่วน</div>
                </div>
              </div>
              <Link href="/leaks" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#c4593f', fontWeight: 600, textDecoration: 'none' }}>
                ดูทั้งหมด
                <span className="material-symbols-rounded" style={{ fontSize: 17 }}>chevron_right</span>
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRIORITY_TASKS.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 11, border: '1px solid #f0f2f5' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#f5f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#7a8893', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    {i + 1}
                  </div>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>check_box_outline_blank</span>
                  <div style={{ flex: 1, fontSize: 13.5, color: '#5b6b77' }}>{t.label}</div>
                  <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, background: t.countBg, color: t.countColor }}>
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ width: 312, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Tax invoices */}
          <div style={{ background: 'linear-gradient(135deg,#ecebf8,#f5f4fc)', borderRadius: 18, padding: 20, border: '1px solid #e3e1f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#6760a8' }}>article</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>ใบกำกับภาษีรอส่ง</div>
              </div>
              <Link href="/documents" style={{ fontSize: 12.5, color: '#6760a8', fontWeight: 600, textDecoration: 'none' }}>ดูทั้งหมด</Link>
            </div>
            <div style={{ fontSize: 12, color: '#8a7fb5', marginBottom: 14 }}>
              ออกแล้วแต่ยังไม่ได้ส่งให้ลูกค้า
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingDocs.length > 0 ? pendingDocs.map(doc => {
                const total = calcDocTotal(doc.items, doc.discount, doc.vatEnabled)
                return (
                  <div key={doc.no} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', borderRadius: 11, padding: '11px 13px', cursor: 'pointer' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#ecebf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#6760a8' }}>article</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45' }}>{doc.clientName || '-'}</div>
                      <div style={{ fontSize: 11, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{doc.no} · {doc.issueDate}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{Math.round(total).toLocaleString('th-TH')}</div>
                  </div>
                )
              }) : [
                { cust: 'LUXE CO., LTD.', no: 'TAX-2025-001', date: '20/05/68', amount: 53500 },
                { cust: 'GLOWME', no: 'TAX-2025-002', date: '19/05/68', amount: 47500 },
                { cust: 'PERCARE', no: 'TAX-2025-003', date: '18/05/68', amount: 32100 },
              ].map(inv => (
                <div key={inv.no} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', borderRadius: 11, padding: '11px 13px', cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#ecebf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#6760a8' }}>article</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45' }}>{inv.cust}</div>
                    <div style={{ fontSize: 11, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{inv.no} · {inv.date}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{inv.amount.toLocaleString('th-TH')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Calendar */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>ปฏิทินงานวันนี้</div>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>expand_more</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#8a97a2', marginBottom: 14 }}>{todayStr}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 16 }}>
              {weekDays.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 11, color: '#9aa7b2', paddingBottom: 4 }}>{d.label}</div>
              ))}
              {weekDays.map((d, i) => (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: '50%', margin: '0 auto',
                  background: d.isToday ? '#5f7d99' : 'transparent',
                  color: d.isToday ? '#fff' : '#2f3b45',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: d.isToday ? 700 : 400,
                }}>
                  {d.date}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SCHEDULE.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 11 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif", width: 48, flexShrink: 0, paddingTop: 1 }}>{ev.time}</div>
                  <div style={{ borderLeft: '2px solid #cdd9e3', paddingLeft: 11, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2f3b45' }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 1 }}>{ev.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 14 }}>ภารกิจที่ต้องทำ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {PRIORITY_TASKS.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 21, color: '#c3cdd6' }}>check_box_outline_blank</span>
                  <span style={{ flex: 1, fontSize: 13.5, color: '#5b6b77' }}>{t.label}</span>
                  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: t.countBg, color: t.countColor }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>กิจกรรมล่าสุด</div>
              <div style={{ fontSize: 12.5, color: '#4f7bb0', fontWeight: 500, cursor: 'pointer' }}>ดูทั้งหมด</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {ACTIVITIES.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 11 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: a.iconColor }}>{a.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#3b4954', lineHeight: 1.4 }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: '#9aa7b2', marginTop: 2 }}>{a.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
