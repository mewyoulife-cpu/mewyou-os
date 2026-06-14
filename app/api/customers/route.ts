import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { purchaseTotalsByCustomer } from '@/lib/customerStats'

export async function GET() {
  const [customers, docs] = await Promise.all([
    prisma.customer.findMany({
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.document.findMany({
      where: { type: { in: ['invoice', 'receipt'] } },
      select: { customerId: true, type: true, refInvoiceId: true, items: true, discount: true, vatEnabled: true },
    }),
  ])
  const totals = purchaseTotalsByCustomer(docs)
  return NextResponse.json(customers.map(c => ({ ...c, totalPurchase: totals[c.id] || 0 })))
}

export async function POST(req: Request) {
  const body = await req.json()
  const customer = await prisma.customer.create({ data: body })
  return NextResponse.json(customer)
}
