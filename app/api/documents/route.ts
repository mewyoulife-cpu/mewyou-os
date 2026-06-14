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

const STRING_FIELDS = [
  'type', 'status', 'quotationId', 'refInvoiceId', 'customerId',
  'clientName', 'clientAddress', 'clientTaxId', 'clientContact', 'clientPhone',
  'payMethod', 'payDate', 'payRef', 'slipUrl', 'slipOcr', 'issueDate', 'dueDate',
  'delivery', 'notes',
] as const

export async function POST(req: Request) {
  const body = await req.json()
  const prefix = body.type === 'invoice' ? 'INV' : body.type === 'receipt' ? 'REC' : 'TAX'
  const count = await prisma.document.count({ where: { type: body.type } })
  const no = `${prefix}-${new Date().getFullYear() + 543}-${String(count + 1).padStart(4, '0')}`

  // Build a whitelisted payload so unknown keys / empty foreign keys can't break the insert.
  const data: Record<string, unknown> = {
    no,
    items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
    discount: Number(body.discount) || 0,
    vatEnabled: body.vatEnabled !== false,
    bankIndex: body.bankIndex != null ? Number(body.bankIndex) : null,
  }
  for (const f of STRING_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f]
  }

  try {
    const doc = await prisma.document.create({ data: data as Parameters<typeof prisma.document.create>[0]['data'] })
    return NextResponse.json(doc)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'create failed' }, { status: 400 })
  }
}
