import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nextDocSeq } from '@/lib/docNumber'

export async function GET() {
  const quotations = await prisma.quotation.findMany({
    include: { customer: true, project: { select: { id: true, code: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(quotations)
}

// Whitelisted columns so unknown keys / empty foreign keys can't break the insert.
const STRING_FIELDS = [
  'status', 'customerId', 'projectId', 'issueDate', 'expiry', 'paymentTerm',
  'clientName', 'clientAddress', 'clientTaxId', 'clientContact', 'clientPhone', 'notes', 'terms',
] as const

// Highest existing sequence for the year — used only to seed the persistent
// counter the first time (so numbering continues from legacy rows).
async function currentMaxSeq(year: number): Promise<number> {
  const existing = await prisma.quotation.findMany({
    where: { no: { startsWith: `QO-${year}-` } },
    select: { no: true },
  })
  return existing.reduce((m, q) => {
    const n = parseInt(q.no.split('-')[2] || '0', 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
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

  // Allocate from the persistent counter so numbers never repeat after deletes.
  const key = `QO-${year}`
  for (let attempt = 0; attempt < 5; attempt++) {
    const seq = await nextDocSeq(key, () => currentMaxSeq(year))
    const no = `QO-${year}-${String(seq).padStart(4, '0')}`
    try {
      const quotation = await prisma.quotation.create({
        data: { ...data, no } as Parameters<typeof prisma.quotation.create>[0]['data'],
      })
      return NextResponse.json(quotation)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      // Collision with a legacy number → take the next counter value and retry.
      if (msg.includes('Unique constraint') || msg.includes('P2002')) continue
      return NextResponse.json({ error: msg || 'create failed' }, { status: 400 })
    }
  }
  return NextResponse.json({ error: 'could not allocate quotation number' }, { status: 409 })
}
