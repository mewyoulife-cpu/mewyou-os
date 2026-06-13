import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.settings.findFirst()
  return NextResponse.json(settings ?? { companyName: 'mew.you', address: '', taxId: '', vatRate: 7, phone: '', email: '' })
}

export async function PUT(req: Request) {
  const data = await req.json()
  const settings = await prisma.settings.upsert({
    where: { id: 'settings' },
    update: data,
    create: { id: 'settings', ...data },
  })
  return NextResponse.json(settings)
}
