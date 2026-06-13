import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const where = type ? { type } : {}
  const docs = await prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(docs)
}

export async function POST(req: Request) {
  const body = await req.json()
  const prefix = body.type === 'invoice' ? 'INV' : body.type === 'receipt' ? 'REC' : 'TAX'
  const count = await prisma.document.count({ where: { type: body.type } })
  const no = `${prefix}-${new Date().getFullYear() + 543}-${String(count + 1).padStart(4, '0')}`
  const doc = await prisma.document.create({
    data: { ...body, no, items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []) }
  })
  return NextResponse.json(doc)
}
