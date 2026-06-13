import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM
  const where = month ? { date: { startsWith: month } } : {}
  const notes = await prisma.calendarNote.findMany({ where, orderBy: { date: 'asc' } })
  return NextResponse.json(notes)
}

export async function POST(req: Request) {
  const body = await req.json()
  const note = await prisma.calendarNote.create({ data: body })
  return NextResponse.json(note)
}
