import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { documentTotal } from '@/lib/customerStats'

// Always read live data — no caching, so the page reflects near real-time state.
export const dynamic = 'force-dynamic'

const DAY_MS = 86400000

// Days since a record was created (reliable: createdAt is a real DateTime).
function daysSince(createdAt: Date): number {
  return Math.floor((Date.now() - createdAt.getTime()) / DAY_MS)
}

// Try to parse a possibly-messy date string. Returns null if unusable.
// Handles ISO / 'YYYY-MM-DD' and Thai 'DD/MM/BE' (Buddhist year) gracefully.
function parseLooseDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const raw = s.trim()
  if (!raw || raw === '-') return null

  // Thai-style DD/MM/YYYY where YYYY may be a Buddhist-era year.
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slash) {
    const d = Number(slash[1])
    const m = Number(slash[2])
    let y = Number(slash[3])
    if (y > 2400) y -= 543 // Buddhist era -> Gregorian
    else if (y < 100) y += 2000
    const dt = new Date(y, m - 1, d)
    return Number.isNaN(dt.getTime()) ? null : dt
  }

  const dt = new Date(raw)
  return Number.isNaN(dt.getTime()) ? null : dt
}

// Is the given date string strictly before "today" (date-only comparison)?
function isPast(s: string | null | undefined): boolean {
  const d = parseLooseDate(s)
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d.getTime() < today.getTime()
}

// Is the given date string within the next `n` days (inclusive of today)?
function isWithinDays(s: string | null | undefined, n: number): boolean {
  const d = parseLooseDate(s)
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today.getTime() + n * DAY_MS)
  return d.getTime() >= today.getTime() && d.getTime() <= limit.getTime()
}

const r = (n: number) => Math.round(n)

type DocRow = {
  id: string
  no: string
  type: string
  status: string
  refInvoiceId: string | null
  clientName: string | null
  items: string
  discount: number
  vatEnabled: boolean
  dueDate: string | null
  createdAt: Date
}

export async function GET() {
  const [documents, quotations, projects] = await Promise.all([
    prisma.document.findMany({
      select: {
        id: true,
        no: true,
        type: true,
        status: true,
        refInvoiceId: true,
        clientName: true,
        items: true,
        discount: true,
        vatEnabled: true,
        dueDate: true,
        createdAt: true,
      },
    }),
    prisma.quotation.findMany({
      select: {
        id: true,
        no: true,
        status: true,
        clientName: true,
        items: true,
        discount: true,
        vatEnabled: true,
        expiry: true,
        createdAt: true,
        customer: { select: { name: true, company: true } },
      },
    }),
    prisma.project.findMany({
      select: {
        code: true,
        name: true,
        status: true,
        value: true,
        dueDate: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
  ])

  const docs = documents as DocRow[]

  // --- Helpers over documents ---------------------------------------------
  const isInvoice = (d: DocRow) => d.type === 'invoice' || d.type === 'taxinvoice'

  // Sum of receipt totals issued against a given invoice id.
  const receiptsByInvoice: Record<string, number> = {}
  for (const d of docs) {
    if (d.type === 'receipt' && d.refInvoiceId) {
      receiptsByInvoice[d.refInvoiceId] =
        (receiptsByInvoice[d.refInvoiceId] || 0) + documentTotal(d)
    }
  }
  const sumReceiptsFor = (invoiceId: string) => receiptsByInvoice[invoiceId] || 0

  // Unpaid invoices/taxinvoices with their remaining outstanding balance.
  const unpaidInvoices = docs
    .filter(d => isInvoice(d) && d.status !== 'paid')
    .map(d => {
      const total = documentTotal(d)
      const remaining = Math.max(0, total - sumReceiptsFor(d.id))
      return { d, total, remaining }
    })
    .filter(x => x.remaining > 0)

  // Sent quotations (with parsed total + expired flag).
  const sentQuotations = quotations
    .filter(q => q.status === 'sent')
    .map(q => {
      const total = documentTotal({
        items: q.items,
        discount: q.discount,
        vatEnabled: q.vatEnabled,
      })
      const cust = q.clientName || q.customer?.company || q.customer?.name || '—'
      return { q, total, cust, expired: isPast(q.expiry) }
    })

  // Delivered-but-not-billed projects (Document has no projectId, so value is a proxy).
  const deliveredProjects = projects.filter(p => p.status === 'deliver')

  // --- A) totalAtRisk + breakdown -----------------------------------------
  const unpaidInvoiceSubtotal = unpaidInvoices.reduce((s, x) => s + x.remaining, 0)
  const sentQuotationSubtotal = sentQuotations.reduce((s, x) => s + x.total, 0)
  const expiredQuotationSubtotal = sentQuotations
    .filter(x => x.expired)
    .reduce((s, x) => s + x.total, 0)
  const deliveredNotBilledSubtotal = deliveredProjects.reduce((s, p) => s + p.value, 0)

  // Expired is a subset of sent — include sent once (not added twice).
  const totalAtRisk =
    unpaidInvoiceSubtotal + sentQuotationSubtotal + deliveredNotBilledSubtotal

  const breakdown = {
    unpaidInvoices: r(unpaidInvoiceSubtotal),
    sentQuotations: r(sentQuotationSubtotal),
    expiredQuotations: r(expiredQuotationSubtotal),
    deliveredNotBilled: r(deliveredNotBilledSubtotal),
  }

  // --- B) Priority engine --------------------------------------------------
  type Candidate = {
    type: string
    cust: string
    code: string
    amount: number
    days: number
    tier: 'urgent' | 'high' | 'normal'
    tierLabel: string
    action: string
    icon: string
    score: number
  }

  const tierFor = (days: number, escalated: boolean) => {
    if (days >= 45 || escalated) return { tier: 'urgent' as const, label: 'ด่วนที่สุด' }
    if (days >= 21) return { tier: 'high' as const, label: 'ด่วนมาก' }
    return { tier: 'normal' as const, label: 'ควรทำเร็ว' }
  }

  const candidates: Candidate[] = []

  for (const { d, remaining } of unpaidInvoices) {
    const days = daysSince(d.createdAt)
    const overdue = isPast(d.dueDate) || days > 30
    const urgency = (1 + days / 30) * (overdue ? 1.5 : 1)
    const t = tierFor(days, overdue)
    candidates.push({
      type: 'ใบแจ้งหนี้ค้างชำระ',
      cust: d.clientName || '—',
      code: d.no,
      amount: remaining,
      days,
      tier: t.tier,
      tierLabel: t.label,
      action: 'โทรทวง / ส่งใบแจ้งเตือน',
      icon: 'schedule',
      score: remaining * urgency,
    })
  }

  for (const { q, total, cust, expired } of sentQuotations) {
    const days = daysSince(q.createdAt)
    const urgency = (1 + days / 30) * (expired ? 1.5 : 1)
    const t = tierFor(days, expired)
    candidates.push({
      type: expired ? 'ใบเสนอราคาหมดอายุ' : 'ใบเสนอราคารอตอบกลับ',
      cust,
      code: q.no,
      amount: total,
      days,
      tier: t.tier,
      tierLabel: t.label,
      action: 'ติดตามลูกค้า',
      icon: 'mail',
      score: total * urgency,
    })
  }

  for (const p of deliveredProjects) {
    const days = daysSince(p.createdAt)
    const urgency = 1 + days / 30
    const t = tierFor(days, false)
    candidates.push({
      type: 'ส่งงานแล้วยังไม่วางบิล',
      cust: p.customer?.name || '—',
      code: p.code,
      amount: p.value,
      days,
      tier: t.tier,
      tierLabel: t.label,
      action: 'ออกใบแจ้งหนี้',
      icon: 'receipt_long',
      score: p.value * urgency,
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  const top = candidates.slice(0, 8)
  const maxAmount = top.reduce((m, c) => Math.max(m, c.amount), 0)
  const priority = top.map(c => ({
    type: c.type,
    cust: c.cust,
    code: c.code,
    amount: r(c.amount),
    days: c.days,
    tier: c.tier,
    tierLabel: c.tierLabel,
    action: c.action,
    icon: c.icon,
    bar: maxAmount > 0 ? Math.round((c.amount / maxAmount) * 100) : 0,
  }))

  // --- C) Quotation tracking ----------------------------------------------
  const awaitingReplyList = sentQuotations.filter(x => !x.expired)
  const nearExpiryList = sentQuotations.filter(
    x => !x.expired && isWithinDays(x.q.expiry, 7),
  )
  const expiredList = sentQuotations.filter(x => x.expired)
  const sum = (arr: { total: number }[]) => arr.reduce((s, x) => s + x.total, 0)

  const quotationTracking = {
    awaitingReply: { count: awaitingReplyList.length, amount: r(sum(awaitingReplyList)) },
    nearExpiry: { count: nearExpiryList.length, amount: r(sum(nearExpiryList)) },
    expired: { count: expiredList.length, amount: r(sum(expiredList)) },
    totalValue: r(sentQuotationSubtotal),
  }

  // --- D) Receivables (AR aging) ------------------------------------------
  const buckets: Record<string, number> = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
  const debtorMap: Record<string, { amount: number; oldestDays: number }> = {}
  let overdueCount = 0
  let overdueAmount = 0

  for (const { d, remaining } of unpaidInvoices) {
    const days = daysSince(d.createdAt)
    if (days <= 30) buckets['0-30'] += remaining
    else if (days <= 60) buckets['31-60'] += remaining
    else if (days <= 90) buckets['61-90'] += remaining
    else buckets['90+'] += remaining

    const name = d.clientName || '—'
    if (!debtorMap[name]) debtorMap[name] = { amount: 0, oldestDays: 0 }
    debtorMap[name].amount += remaining
    debtorMap[name].oldestDays = Math.max(debtorMap[name].oldestDays, days)

    if (isPast(d.dueDate) || days > 30) {
      overdueCount += 1
      overdueAmount += remaining
    }
  }

  const topDebtors = Object.entries(debtorMap)
    .map(([name, v]) => ({ name, amount: r(v.amount), oldestDays: v.oldestDays }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const receivables = {
    aging: [
      { bucket: '0-30', amount: r(buckets['0-30']) },
      { bucket: '31-60', amount: r(buckets['31-60']) },
      { bucket: '61-90', amount: r(buckets['61-90']) },
      { bucket: '90+', amount: r(buckets['90+']) },
    ],
    total: r(unpaidInvoiceSubtotal),
    topDebtors,
    overdueCount,
    overdueAmount: r(overdueAmount),
  }

  // --- E) Delivered, not billed -------------------------------------------
  const deliveredNotBilledList = deliveredProjects.map(p => ({
    code: p.code,
    name: p.name,
    cust: p.customer?.name || '—',
    value: r(p.value),
  }))
  const deliveredNotBilled = {
    list: deliveredNotBilledList,
    count: deliveredNotBilledList.length,
    total: r(deliveredNotBilledSubtotal),
  }

  // --- F) Partial payments -------------------------------------------------
  const partialList: {
    no: string
    cust: string
    total: number
    received: number
    remaining: number
  }[] = []
  for (const d of docs) {
    if (!isInvoice(d)) continue
    const total = documentTotal(d)
    const received = sumReceiptsFor(d.id)
    if (received > 0 && received < total) {
      partialList.push({
        no: d.no,
        cust: d.clientName || '—',
        total: r(total),
        received: r(received),
        remaining: r(total - received),
      })
    }
  }
  const partialPayments = {
    list: partialList,
    count: partialList.length,
    totalRemaining: partialList.reduce((s, x) => s + x.remaining, 0),
  }

  return NextResponse.json({
    totalAtRisk: r(totalAtRisk),
    breakdown,
    priority,
    quotationTracking,
    receivables,
    deliveredNotBilled,
    partialPayments,
  })
}
