import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { documentTotal } from '@/lib/customerStats'
import { CHINA_TYPE, THAI_TYPE, chinaNetProfit } from '@/lib/chinaPackaging'

const THAI_SHORT_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const DAY_MS = 86400000

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function trend(cur: number, prev: number): { up: boolean; pct: string } {
  const up = cur >= prev
  const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0
  return { up, pct: `${pct >= 0 ? '+' : ''}${pct}%` }
}

// Build an adaptive sales series for the selected range:
// daily buckets up to ~1 month, weekly up to a quarter, otherwise monthly.
function buildSales(projects: { value: number; createdAt: Date }[], from: Date, to: Date) {
  const spanDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS))
  const labels: string[] = []
  const data: number[] = []

  if (spanDays > 92) {
    // monthly
    const idx = new Map<string, number>()
    let d = new Date(from.getFullYear(), from.getMonth(), 1)
    const end = new Date(to.getFullYear(), to.getMonth(), 1)
    while (d <= end) {
      idx.set(`${d.getFullYear()}-${d.getMonth()}`, labels.length)
      labels.push(THAI_SHORT_MONTHS[d.getMonth()])
      data.push(0)
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    }
    for (const p of projects) {
      const i = idx.get(`${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`)
      if (i != null) data[i] += p.value
    }
  } else if (spanDays > 31) {
    // weekly
    const start0 = startOfDay(from).getTime()
    const weeks = Math.ceil(spanDays / 7)
    for (let i = 0; i < weeks; i++) {
      const ws = new Date(start0 + i * 7 * DAY_MS)
      labels.push(`${ws.getDate()}/${ws.getMonth() + 1}`)
      data.push(0)
    }
    for (const p of projects) {
      const wi = Math.floor((startOfDay(p.createdAt).getTime() - start0) / (7 * DAY_MS))
      if (wi >= 0 && wi < data.length) data[wi] += p.value
    }
  } else {
    // daily
    const idx = new Map<string, number>()
    let d = startOfDay(from)
    const end = startOfDay(to)
    while (d <= end) {
      idx.set(dayKey(d), labels.length)
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`)
      data.push(0)
      d = new Date(d.getTime() + DAY_MS)
    }
    for (const p of projects) {
      const i = idx.get(dayKey(startOfDay(p.createdAt)))
      if (i != null) data[i] += p.value
    }
  }

  return { labels, data: data.map(v => Math.round(v)) }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const now = new Date()
  const fromD = sp.get('from') ? new Date(sp.get('from')!) : new Date(now.getFullYear(), now.getMonth(), 1)
  const toD = sp.get('to') ? new Date(sp.get('to')!) : now

  // Previous equal-length period immediately before the selected range.
  const dur = toD.getTime() - fromD.getTime()
  const prevTo = new Date(fromD.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - dur)

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const invoiceWhere = { type: 'invoice', status: { in: ['draft', 'sent', 'overdue'] } }

  const [
    rangeProjects,
    prevProjects,
    rangeInvoices,
    prevInvoices,
    // global widgets (not range-filtered)
    nonCompletedProjects,
    outstandingDocsGlobal,
    pendingSendDocs,
    sentQuotations,
    paymentProjects,
    draftBillingDocs,
    todayNotes,
    todayDueProjects,
    activityProjects,
    activityDocuments,
    activityQuotations,
  ] = await Promise.all([
    prisma.project.findMany({
      where: { createdAt: { gte: fromD, lte: toD } },
      include: { customer: { select: { name: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.findMany({
      where: { createdAt: { gte: prevFrom, lte: prevTo } },
      select: { status: true, value: true, type: true, cost: true, chinaData: true },
    }),
    prisma.document.findMany({
      where: { ...invoiceWhere, createdAt: { gte: fromD, lte: toD } },
      select: { items: true, discount: true, vatEnabled: true },
    }),
    prisma.document.findMany({
      where: { ...invoiceWhere, createdAt: { gte: prevFrom, lte: prevTo } },
      select: { items: true, discount: true, vatEnabled: true },
    }),
    prisma.project.findMany({
      where: { status: { not: 'completed' } },
      select: { name: true, dueDate: true, value: true, status: true },
    }),
    prisma.document.findMany({
      where: invoiceWhere,
      select: { items: true, discount: true, vatEnabled: true },
    }),
    prisma.document.findMany({
      where: { type: 'taxinvoice', txEmailSent: false, txPostSent: false },
      orderBy: { createdAt: 'asc' },
      take: 5,
      select: { no: true, clientName: true, issueDate: true, items: true, discount: true, vatEnabled: true },
    }),
    prisma.quotation.findMany({ where: { status: 'sent' }, select: { items: true, discount: true, vatEnabled: true } }),
    prisma.project.findMany({ where: { status: 'payment' }, select: { value: true } }),
    prisma.document.findMany({ where: { type: { in: ['invoice', 'taxinvoice'] }, status: 'draft' }, select: { items: true, discount: true, vatEnabled: true } }),
    prisma.calendarNote.findMany({ where: { date: todayKey } }),
    prisma.project.findMany({ where: { dueDate: todayKey }, select: { name: true } }),
    prisma.project.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, createdAt: true } }),
    prisma.document.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { no: true, type: true, createdAt: true, updatedAt: true } }),
    prisma.quotation.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { no: true, createdAt: true } }),
  ])

  // ---- KPIs (range vs previous period) ----
  const projCount = rangeProjects.length
  const prevProjCount = prevProjects.length
  const waiting = rangeProjects.filter(p => p.status === 'design').length
  const prevWaiting = prevProjects.filter(p => p.status === 'design').length
  const completed = rangeProjects.filter(p => p.status === 'completed').length
  const prevCompleted = prevProjects.filter(p => p.status === 'completed').length
  const sales = rangeProjects.reduce((s, p) => s + p.value, 0)
  const prevSales = prevProjects.reduce((s, p) => s + p.value, 0)
  const outstanding = rangeInvoices.reduce((s, d) => s + documentTotal(d), 0)
  const prevOutstanding = prevInvoices.reduce((s, d) => s + documentTotal(d), 0)

  // ---- Packaging-production net profit (China = chinaData sheet; Thai = value - cost) ----
  const hasType = (t: string | null | undefined, key: string) => (t || '').includes(key)
  const sumChinaProfit = (rows: { type?: string | null; chinaData?: string | null }[]) =>
    rows.filter(p => hasType(p.type, CHINA_TYPE)).reduce((s, p) => s + chinaNetProfit(p.chinaData), 0)
  const sumThaiProfit = (rows: { type?: string | null; value?: number; cost?: number }[]) =>
    rows.filter(p => hasType(p.type, THAI_TYPE)).reduce((s, p) => s + ((p.value || 0) - (p.cost || 0)), 0)

  const chinaProfit = sumChinaProfit(rangeProjects)
  const prevChinaProfit = sumChinaProfit(prevProjects)
  const thaiProfit = sumThaiProfit(rangeProjects)
  const prevThaiProfit = sumThaiProfit(prevProjects)

  const kpis = {
    projects: { value: projCount, ...trend(projCount, prevProjCount) },
    waitingDesign: { value: waiting, ...trend(waiting, prevWaiting) },
    completed: { value: completed, ...trend(completed, prevCompleted) },
    sales: { value: Math.round(sales), ...trend(sales, prevSales) },
    outstanding: { value: Math.round(outstanding), ...trend(outstanding, prevOutstanding) },
    chinaProfit: { value: Math.round(chinaProfit), ...trend(chinaProfit, prevChinaProfit) },
    thaiProfit: { value: Math.round(thaiProfit), ...trend(thaiProfit, prevThaiProfit) },
  }

  // ---- Donut (status breakdown of projects in range) ----
  const byStatus = (status: string) => rangeProjects.filter(p => p.status === status).length
  const donut = {
    design: byStatus('design'),
    deliver: byStatus('deliver'),
    revision: byStatus('revision'),
    approved: byStatus('approved'),
    completed: byStatus('completed'),
  }

  // ---- Sales chart (adaptive to range) ----
  const salesChart = buildSales(rangeProjects.map(p => ({ value: p.value, createdAt: p.createdAt })), fromD, toD)

  // ---- Recent projects (in range) ----
  const recentProjects = rangeProjects.slice(0, 5).map(p => ({
    id: p.id,
    code: p.code,
    customerName: p.customer?.name || '-',
    customerLogo: p.customer?.logo || null,
    type: p.type,
    status: p.status,
    dueDate: p.dueDate || null,
    value: p.value,
  }))

  // ---- Global widgets ----
  const outstandingTotalGlobal = outstandingDocsGlobal.reduce((s, d) => s + documentTotal(d), 0)
  const overdueProjects = nonCompletedProjects.filter(p => p.dueDate && p.dueDate < todayKey)
  const overdueValue = overdueProjects.reduce((s, p) => s + p.value, 0)
  const quotationSentTotal = sentQuotations.reduce((s, q) => s + documentTotal(q), 0)
  const depositValue = paymentProjects.reduce((s, p) => s + p.value, 0)
  const draftBillingTotal = draftBillingDocs.reduce((s, d) => s + documentTotal(d), 0)

  const leakCandidates = [
    { type: 'หนี้ค้างชำระ', tier: 'ด่วนที่สุด', tierBg: '#fbe9e5', tierColor: '#c4593f', icon: 'schedule', iconColor: '#c4593f', cust: `${outstandingDocsGlobal.length} รายการ`, action: 'โทรทวง / ส่งใบแจ้งเตือน', amount: outstandingTotalGlobal },
    { type: 'ใบเสนอราคาค้างตอบ', tier: 'ด่วนมาก', tierBg: '#fdeee9', tierColor: '#d97b53', icon: 'mail', iconColor: '#d97b53', cust: `${sentQuotations.length} ใบ`, action: 'ติดตามลูกค้า', amount: quotationSentTotal },
    { type: 'งานเลยกำหนดส่ง', tier: 'ด่วนมาก', tierBg: '#fdeee9', tierColor: '#d97b53', icon: 'update', iconColor: '#d97b53', cust: `${overdueProjects.length} งาน`, action: 'เร่งส่งมอบงาน', amount: overdueValue },
    { type: 'รอเก็บมัดจำ', tier: 'ควรทำเร็ว', tierBg: '#e8eef4', tierColor: '#5f7d99', icon: 'savings', iconColor: '#5f7d99', cust: `${paymentProjects.length} โปรเจกต์`, action: 'ออกใบแจ้งหนี้มัดจำ', amount: depositValue },
    { type: 'ใบกำกับฯ/ใบแจ้งหนี้ รอส่ง', tier: 'ปกติ', tierBg: '#ecebf8', tierColor: '#6760a8', icon: 'article', iconColor: '#6760a8', cust: `${draftBillingDocs.length} ฉบับ`, action: 'ส่งให้ลูกค้า', amount: draftBillingTotal },
  ]
  const leaks = leakCandidates.filter(l => l.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5)

  const tasks = [
    { label: 'ใบเสนอราคาค้างตอบ', count: sentQuotations.length, countColor: '#c4593f', countBg: '#fbe9e5' },
    { label: 'งานเลยกำหนดส่ง', count: overdueProjects.length, countColor: '#c4593f', countBg: '#fbe9e5' },
    { label: 'รอเก็บมัดจำ', count: paymentProjects.length, countColor: '#a9762f', countBg: '#fdf3e3' },
    { label: 'Revision ค้างอยู่', count: nonCompletedProjects.filter(p => p.status === 'revision').length, countColor: '#5f7d99', countBg: '#e8eef4' },
    { label: 'ใบแจ้งหนี้/ใบกำกับฯ รอส่ง', count: draftBillingDocs.length, countColor: '#6760a8', countBg: '#ecebf8' },
  ].filter(t => t.count > 0).slice(0, 5)

  const schedule = [
    ...todayNotes.map(n => ({ title: n.text, sub: n.priority === 'high' || n.priority === 'urgent' ? 'งานสำคัญ' : 'ปกติ', sortKey: n.createdAt.getTime() })),
    ...todayDueProjects.map(p => ({ title: `ส่งงาน ${p.name}`, sub: 'กำหนดส่งวันนี้', sortKey: Number.MAX_SAFE_INTEGER })),
  ].sort((a, b) => a.sortKey - b.sortKey).slice(0, 5)

  const pendingSend = {
    total: Math.round(pendingSendDocs.reduce((s, d) => s + documentTotal(d), 0)),
    docs: pendingSendDocs.map(d => ({ no: d.no, clientName: d.clientName || '-', issueDate: d.issueDate, total: Math.round(documentTotal(d)) })),
  }

  const activities = [
    ...activityProjects.map(p => ({ icon: 'add_task', iconBg: '#e9f3ed', iconColor: '#3d8a64', title: `สร้างโปรเจกต์ ${p.name}`, ts: p.createdAt.toISOString() })),
    ...activityDocuments.map(d => {
      const edited = d.updatedAt.getTime() - d.createdAt.getTime() > 60000
      if (d.type === 'receipt') {
        return { icon: 'payments', iconBg: '#fdf3e3', iconColor: '#f4a431', title: `รับชำระเงิน ${d.no}`, ts: d.createdAt.toISOString() }
      }
      return { icon: 'description', iconBg: '#ecebf8', iconColor: '#6760a8', title: edited ? `แก้ไขเอกสาร ${d.no}` : `สร้างเอกสาร ${d.no}`, ts: (edited ? d.updatedAt : d.createdAt).toISOString() }
    }),
    ...activityQuotations.map(q => ({ icon: 'request_quote', iconBg: '#ecebf8', iconColor: '#6760a8', title: `สร้างใบเสนอราคา ${q.no}`, ts: q.createdAt.toISOString() })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 5)

  return NextResponse.json(
    { kpis, donut, salesChart, recentProjects, leaks, tasks, schedule, pendingSend, activities },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
