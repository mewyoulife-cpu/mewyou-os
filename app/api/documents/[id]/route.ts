import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { quotation: { select: { no: true } } },
  })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let refNo: string | null = doc.quotation?.no ?? null
  if (!refNo && doc.refInvoiceId) {
    const ref = await prisma.document.findUnique({ where: { id: doc.refInvoiceId }, select: { no: true } })
    refNo = ref?.no ?? null
  }
  return NextResponse.json({ ...doc, refNo })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data = { ...body }
  if (body.items !== undefined) {
    data.items = typeof body.items === 'string' ? body.items : JSON.stringify(body.items)
  }
  const doc = await prisma.document.update({ where: { id }, data })
  return NextResponse.json(doc)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.document.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
