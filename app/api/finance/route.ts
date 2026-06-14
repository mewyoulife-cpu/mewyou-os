import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [projects, expenses, docs] = await Promise.all([
    prisma.project.findMany({ select: { value: true, cost: true, type: true, status: true, createdAt: true } }),
    prisma.expense.findMany({ orderBy: { date: 'desc' } }),
    prisma.document.findMany({ where: { type: 'invoice' }, select: { status: true, items: true, discount: true, vatEnabled: true } }),
  ])

  const totalRevenue = projects.reduce((s, p) => s + (p.status === 'completed' ? p.value : 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalProfit = totalRevenue - totalExpenses

  return NextResponse.json({ projects, expenses, totalRevenue, totalExpenses, totalProfit })
}

export async function POST(req: Request) {
  const body = await req.json()
  const expense = await prisma.expense.create({ data: body })
  return NextResponse.json(expense)
}
