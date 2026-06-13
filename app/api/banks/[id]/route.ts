import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const bank = await prisma.bankAccount.update({ where: { id }, data: body })
  return NextResponse.json(bank)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.bankAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
