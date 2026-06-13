import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const quotations = await prisma.quotation.findMany({
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(quotations)
}

export async function POST(req: Request) {
  const body = await req.json()
  const count = await prisma.quotation.count()
  const no = `QO-${new Date().getFullYear() + 543}-${String(count + 1).padStart(4, '0')}`
  const quotation = await prisma.quotation.create({
    data: { ...body, no, items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items) }
  })
  return NextResponse.json(quotation)
}
