export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { documentTotal } from '@/lib/customerStats'
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

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

const THAI_SHORT_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`
}

function trendPill(cur: number, prev: number) {
  const up = cur >= prev
  const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0)
  return {
    up,
    trend: `${pct >= 0 ? '+' : ''}${pct}%`,
    trendIcon: up ? 'trending_up' : 'trending_down',
  }
}

function relativeTime(from: Date, now: Date): string {
  const diffMs = now.getTime() - from.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  return `${days} วันก่อน`
}

interface KpiCard {
  icon: string
  label: string
  value: string
  unit: string
  trend?: string
  trendIcon?: string
  up?: boolean
}

interface PriorityTask {
  label: string
  count: number
  countColor: string
  countBg: string
}

interface ScheduleItem {
  time: string
  title: string
  sub: string
  sortKey: number
}

interface ActivityItem {
  icon: string
  iconBg: string
  iconColor: string
  title: string
  ts: Date
}

export default async function DashboardPage() {
  const today = new Date()
  const todayStr = getThaiBuddhistDate(today)
  const todayKey = toDateStr(today)
  const weekDays = getWeekDays(today)

  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const startOfSixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)

  const sevenDaysAhead = new Date(today)
  sevenDaysAhead.setDate(today.getDate() + 7)
  const sevenDaysAheadKey = toDateStr(sevenDaysAhead)

  const [
    customerCount,
    customersThisMonth,
    customersLastMonth,
    projectCount,
    projectsThisMonth,
    projectsLastMonth,
    recentProjects,
    statusGroups,
    nonCompletedProjects,
    incomeDocs,
    outstandingDocs,
    pendingSendDocs,
    sentQuotationCount,
    paymentProjectCount,
    revisionProjectCount,
    draftBillingDocCount,
    todayNotes,
    todayDueProjects,
    activityProjects,
    activityDocuments,
    activityQuotations,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    prisma.customer.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
    prisma.project.count(),
    prisma.project.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    prisma.project.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
    prisma.project.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.project.groupBy({ by: ['status'], _count: true }),
    prisma.project.findMany({
      where: { status: { not: 'completed' } },
      select: { name: true, dueDate: true },
    }),
    prisma.document.findMany({
      where: { type: { in: ['invoice', 'receipt', 'taxinvoice'] }, refInvoiceId: null },
      select: { items: true, discount: true, vatEnabled: true, createdAt: true },
    }),
    prisma.document.findMany({
      where: { type: 'invoice', status: { in: ['draft', 'sent', 'overdue'] } },
      select: { items: true, discount: true, vatEnabled: true },
    }),
    prisma.document.findMany({
      where: { type: { in: ['invoice', 'taxinvoice'] }, status: { in: ['draft', 'sent'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { no: true, clientName: true, issueDate: true, items: true, discount: true, vatEnabled: true },
    }),
    prisma.quotation.count({ where: { status: 'sent' } }),
    prisma.project.count({ where: { status: 'payment' } }),
    prisma.project.count({ where: { status: 'revision' } }),
    prisma.document.count({ where: { type: { in: ['invoice', 'taxinvoice'] }, status: 'draft' } }),
    prisma.calendarNote.findMany({ where: { date: todayKey } }),
    prisma.project.findMany({ where: { dueDate: todayKey }, select: { name: true } }),
    prisma.project.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, createdAt: true } }),
    prisma.document.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { no: true, type: true, createdAt: true, updatedAt: true } }),
    prisma.quotation.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { no: true, createdAt: true } }),
  ])

  // ---- Sales: this month, last month, and 6-month series from income docs ----
  let salesThisMonth = 0
  let salesLastMonth = 0
  const monthlyTotals = new Map<string, number>()
  for (const doc of incomeDocs) {
    const amount = documentTotal(doc)
    const created = doc.createdAt
    if (created >= startOfThisMonth) salesThisMonth += amount
    else if (created >= startOfLastMonth && created < startOfThisMonth) salesLastMonth += amount
    if (created >= startOfSixMonthsAgo) {
      const key = monthKey(created)
      monthlyTotals.set(key, (monthlyTotals.get(key) || 0) + amount)
    }
  }

  const salesMonths: string[] = []
  const salesData: number[] = []
  for (let i = 5; i >= 0; i--) {
    const m = new Date(today.getFullYear(), today.getMonth() - i, 1)
    salesMonths.push(THAI_SHORT_MONTHS[m.getMonth()])
    salesData.push(Math.round(monthlyTotals.get(monthKey(m)) || 0))
  }

  // ---- Outstanding total ----
  const outstandingTotal = outstandingDocs.reduce((s, d) => s + documentTotal(d), 0)

  // ---- Upcoming projects within next 7 days ----
  const upcomingCount = nonCompletedProjects.filter(p => {
    if (!p.dueDate) return false
    return p.dueDate >= todayKey && p.dueDate <= sevenDaysAheadKey
  }).length

  // ---- KPI cards ----
  const customerTrend = trendPill(customersThisMonth, customersLastMonth)
  const projectTrend = trendPill(projectsThisMonth, projectsLastMonth)
  const salesTrend = trendPill(salesThisMonth, salesLastMonth)

  const kpis: KpiCard[] = [
    { icon: 'group', label: 'จำนวนลูกค้า', value: String(customerCount), unit: 'ราย', ...customerTrend },
    { icon: 'folder_open', label: 'โปรเจกต์ทั้งหมด', value: String(projectCount), unit: 'โปรเจกต์', ...projectTrend },
    { icon: 'payments', label: 'ยอดขาย (เดือนนี้)', value: salesThisMonth > 0 ? fmtShort(Math.round(salesThisMonth)) : '฿0', unit: '', ...salesTrend },
    { icon: 'receipt_long', label: 'ยอดค้างชำระ', value: outstandingTotal > 0 ? fmtShort(Math.round(outstandingTotal)) : '฿0', unit: '' },
    { icon: 'schedule', label: 'งานใกล้กำหนดส่ง', value: String(upcomingCount), unit: 'งาน' },
  ]

  // ---- Donut ----
  const countByStatus = (status: string) => statusGroups.find(g => g.status === status)?.['_count'] ?? 0
  const donutData = [
    { label: 'ออกแบบ',        value: countByStatus('design'),    color: '#2f3b45' },
    { label: 'ผลิต/รอส่งมอบ', value: countByStatus('deliver'),   color: '#5f7d99' },
    { label: 'รออนุมัติ',     value: countByStatus('revision'),  color: '#3d8a64' },
    { label: 'รอผลิต',        value: countByStatus('approved'),  color: '#b0bdc8' },
    { label: 'เสร็จสิ้น',     value: countByStatus('completed'), color: '#c4a882' },
  ]

  // ---- Priority tasks (real) ----
  const overdueProjectCount = nonCompletedProjects.filter(p => p.dueDate && p.dueDate < todayKey).length

  const priorityTasks: PriorityTask[] = ([
    { label: 'ใบเสนอราคาค้างตอบ', count: sentQuotationCount, countColor: '#c4593f', countBg: '#fbe9e5' },
    { label: 'งานเลยกำหนดส่ง', count: overdueProjectCount, countColor: '#c4593f', countBg: '#fbe9e5' },
    { label: 'รอเก็บมัดจำ', count: paymentProjectCount, countColor: '#a9762f', countBg: '#fdf3e3' },
    { label: 'Revision ค้างอยู่', count: revisionProjectCount, countColor: '#5f7d99', countBg: '#e8eef4' },
    { label: 'ใบแจ้งหนี้/ใบกำกับฯ รอส่ง', count: draftBillingDocCount, countColor: '#6760a8', countBg: '#ecebf8' },
  ] as PriorityTask[]).filter(t => t.count > 0).slice(0, 5)

  // ---- Today's schedule ----
  const schedule: ScheduleItem[] = [
    ...todayNotes.map(n => ({
      time: '',
      title: n.text,
      sub: n.priority === 'high' || n.priority === 'urgent' ? 'งานสำคัญ' : 'ปกติ',
      sortKey: n.createdAt.getTime(),
    })),
    ...todayDueProjects.map(p => ({
      time: '',
      title: `ส่งงาน ${p.name}`,
      sub: 'กำหนดส่งวันนี้',
      sortKey: Number.MAX_SAFE_INTEGER,
    })),
  ]
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, 5)

  // ---- Activity feed (real, merged & sorted) ----
  const activities: ActivityItem[] = [
    ...activityProjects.map(p => ({
      icon: 'add_task', iconBg: '#e9f3ed', iconColor: '#3d8a64',
      title: `สร้างโปรเจกต์ ${p.name}`, ts: p.createdAt,
    })),
    ...activityDocuments.map(d => {
      const edited = d.updatedAt.getTime() - d.createdAt.getTime() > 60000
      if (d.type === 'receipt') {
        return { icon: 'payments', iconBg: '#fdf3e3', iconColor: '#f4a431', title: `รับชำระเงิน ${d.no}`, ts: d.createdAt }
      }
      return {
        icon: 'description', iconBg: '#ecebf8', iconColor: '#6760a8',
        title: edited ? `แก้ไขเอกสาร ${d.no}` : `สร้างเอกสาร ${d.no}`,
        ts: edited ? d.updatedAt : d.createdAt,
      }
    }),
    ...activityQuotations.map(q => ({
      icon: 'request_quote', iconBg: '#ecebf8', iconColor: '#6760a8',
      title: `สร้างใบเสนอราคา ${q.no}`, ts: q.createdAt,
    })),
  ]
    .sort((a, b) => b.ts.getTime() - a.ts.getTime())
    .slice(0, 5)

  const card: React.CSSProperties = {
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #edf0f3',
  }

  const emptyState = (icon: string, text: string) => (
    <div style={{ padding: '24px 12px', textAlign: 'center', color: '#9aa7b2', fontSize: 13 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 30, display: 'block', marginBottom: 6, color: '#cdd6df' }}>{icon}</span>
      {text}
    </div>
  )

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
            {k.trend && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12.5, color: k.up ? '#3d8a64' : '#c4593f', marginTop: 6 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{k.trendIcon}</span>
                {k.trend}
                <span style={{ color: '#9aa7b2', marginLeft: 2 }}>จากเดือนที่แล้ว</span>
              </div>
            )}
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
            {recentProjects.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9aa7b2', fontSize: 13.5 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: '#cdd6df' }}>folder_open</span>
                ยังไม่มีโปรเจกต์
              </div>
            ) : recentProjects.map(p => {
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
            {priorityTasks.length === 0 ? emptyState('task_alt', 'ไม่มีงานเร่งด่วน') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {priorityTasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 11, border: '1px solid #f0f2f5' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: '#f5f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#7a8893', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {i + 1}
                    </div>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>check_box_outline_blank</span>
                    <div style={{ flex: 1, fontSize: 13.5, color: '#5b6b77' }}>{t.label}</div>
                    <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, background: t.countBg, color: t.countColor }}>
                      {`${t.count} รายการ`}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
            {pendingSendDocs.length === 0 ? emptyState('article', 'ไม่มีเอกสารรอส่ง') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingSendDocs.map(doc => {
                  const total = documentTotal(doc)
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
                })}
              </div>
            )}
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
            {schedule.length === 0 ? emptyState('event_busy', 'ไม่มีนัดหมายวันนี้') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {schedule.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif", width: 48, flexShrink: 0, paddingTop: 1 }}>{ev.time}</div>
                    <div style={{ borderLeft: '2px solid #cdd9e3', paddingLeft: 11, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2f3b45' }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 1 }}>{ev.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 14 }}>ภารกิจที่ต้องทำ</div>
            {priorityTasks.length === 0 ? emptyState('task_alt', 'ไม่มีงานเร่งด่วน') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {priorityTasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 21, color: '#c3cdd6' }}>check_box_outline_blank</span>
                    <span style={{ flex: 1, fontSize: 13.5, color: '#5b6b77' }}>{t.label}</span>
                    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: t.countBg, color: t.countColor }}>{`${t.count} รายการ`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>กิจกรรมล่าสุด</div>
              <div style={{ fontSize: 12.5, color: '#4f7bb0', fontWeight: 500, cursor: 'pointer' }}>ดูทั้งหมด</div>
            </div>
            {activities.length === 0 ? emptyState('history', 'ยังไม่มีกิจกรรม') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {activities.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 17, color: a.iconColor }}>{a.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#3b4954', lineHeight: 1.4 }}>{a.title}</div>
                      <div style={{ fontSize: 11.5, color: '#9aa7b2', marginTop: 2 }}>{relativeTime(a.ts, today)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
