import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(customers)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const customer = await prisma.customer.create({ data: body })
    return NextResponse.json(customer)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('POST /api/customers error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
