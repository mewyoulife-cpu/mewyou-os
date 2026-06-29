import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { companyFromSettings } from '@/lib/company'

// Public, unauthenticated bundle for the customer-facing share page.
// Returns ONLY what the quotation document needs — no other studio data.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const q = await prisma.quotation.findUnique({
    where: { id },
    select: {
      no: true, status: true, issueDate: true, expiry: true,
      items: true, discount: true, vatEnabled: true, paymentTerm: true, bankIndex: true,
      clientName: true, clientAddress: true, clientTaxId: true, clientContact: true, clientPhone: true,
      notes: true, terms: true,
      customer: { select: { name: true, company: true } },
    },
  })

  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [settings, banks] = await Promise.all([
    prisma.settings.findFirst(),
    prisma.bankAccount.findMany({ orderBy: { createdAt: 'asc' } }),
  ])

  return NextResponse.json({
    quotation: q,
    company: companyFromSettings(settings),
    banks: banks.map(b => ({ bank: b.bank, accountNo: b.accountNo, name: b.name })),
  })
}
