import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { customerPurchaseTotal } from '@/lib/customerStats'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { projects: { orderBy: { createdAt: 'desc' } }, quotations: { orderBy: { createdAt: 'desc' } } }
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const docs = await prisma.document.findMany({
    where: { customerId: id, type: { in: ['invoice', 'receipt'] } },
    select: { customerId: true, type: true, refInvoiceId: true, items: true, discount: true, vatEnabled: true },
  })
  return NextResponse.json({ ...customer, totalPurchase: customerPurchaseTotal(docs) })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const customer = await prisma.customer.update({ where: { id }, data: body })
  return NextResponse.json(customer)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.customer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
