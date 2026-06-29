import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: { customer: true, documents: true, project: { select: { id: true, code: true, name: true } } }
  })
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(q)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const q = await prisma.quotation.update({
    where: { id },
    data: { ...body, items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items) }
  })
  return NextResponse.json(q)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.quotation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
