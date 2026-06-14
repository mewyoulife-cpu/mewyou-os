import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const quotations = await prisma.quotation.findMany({
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(quotations)
}

// Whitelisted columns so unknown keys / empty foreign keys can't break the insert.
const STRING_FIELDS = [
  'status', 'customerId', 'issueDate', 'expiry', 'paymentTerm',
  'clientName', 'clientAddress', 'clientTaxId', 'clientContact', 'clientPhone', 'notes',
] as const

async function nextSequence(year: number): Promise<number> {
  // Base the next number on the highest existing sequence for the year, not the
  // row count — counts drift after deletes and cause duplicate-`no` collisions.
  const existing = await prisma.quotation.findMany({
    where: { no: { startsWith: `QO-${year}-` } },
    select: { no: true },
  })
  const maxSeq = existing.reduce((m, q) => {
    const n = parseInt(q.no.split('-')[2] || '0', 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return maxSeq + 1
}

export async function POST(req: Request) {
  const body = await req.json()
  const year = new Date().getFullYear() + 543

  const data: Record<string, unknown> = {
    items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
    discount: Number(body.discount) || 0,
    vatEnabled: body.vatEnabled === true,
    bankIndex: body.bankIndex != null ? Number(body.bankIndex) : 0,
  }
  for (const f of STRING_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f] === '' ? null : body[f]
  }

  // Retry on the off chance two requests grab the same sequence concurrently.
  let seq = await nextSequence(year)
  for (let attempt = 0; attempt < 5; attempt++) {
    const no = `QO-${year}-${String(seq).padStart(4, '0')}`
    try {
      const quotation = await prisma.quotation.create({
        data: { ...data, no } as Parameters<typeof prisma.quotation.create>[0]['data'],
      })
      return NextResponse.json(quotation)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('Unique constraint') || msg.includes('P2002')) {
        seq += 1
        continue
      }
      return NextResponse.json({ error: msg || 'create failed' }, { status: 400 })
    }
  }
  return NextResponse.json({ error: 'could not allocate quotation number' }, { status: 409 })
}
