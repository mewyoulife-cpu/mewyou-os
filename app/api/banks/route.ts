import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const banks = await prisma.bankAccount.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(banks)
}

export async function POST(req: Request) {
  const body = await req.json()
  const bank = await prisma.bankAccount.create({ data: body })
  return NextResponse.json(bank)
}
