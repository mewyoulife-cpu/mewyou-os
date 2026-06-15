import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nextDocSeq } from '@/lib/docNumber'

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

// Highest existing sequence for this prefix+year — used only to seed the
// persistent counter the first time (so numbering continues from legacy rows).
async function currentMaxSeq(prefix: string, year: number): Promise<number> {
  const existing = await prisma.document.findMany({
    where: { no: { startsWith: `${prefix}-${year}-` } },
    select: { no: true },
  })
  return existing.reduce((m, d) => {
    const n = parseInt(d.no.split('-')[2] || '0', 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
}

export async function POST(req: Request) {
  const body = await req.json()
  const prefix = body.type === 'invoice' ? 'INV' : body.type === 'receipt' ? 'REC' : 'TAX'
  const year = new Date().getFullYear() + 543

  // Build a whitelisted payload so unknown keys / empty foreign keys can't break the insert.
  const data: Record<string, unknown> = {
    items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
    discount: Number(body.discount) || 0,
    vatEnabled: body.vatEnabled !== false,
    bankIndex: body.bankIndex != null ? Number(body.bankIndex) : null,
  }
  for (const f of STRING_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f]
  }

  // Allocate from the persistent counter so numbers never repeat after deletes.
  const key = `${prefix}-${year}`
  for (let attempt = 0; attempt < 5; attempt++) {
    const seq = await nextDocSeq(key, () => currentMaxSeq(prefix, year))
    const no = `${prefix}-${year}-${String(seq).padStart(4, '0')}`
    try {
      const doc = await prisma.document.create({ data: { ...data, no } as Parameters<typeof prisma.document.create>[0]['data'] })
      return NextResponse.json(doc)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      // Collision with a legacy number → take the next counter value and retry.
      if (msg.includes('Unique constraint') || msg.includes('P2002')) continue
      return NextResponse.json({ error: msg || 'create failed' }, { status: 400 })
    }
  }
  return NextResponse.json({ error: 'could not allocate document number' }, { status: 409 })
}
