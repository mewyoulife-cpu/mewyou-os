import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [projectCount, customers, projects, quotations, expenses] = await Promise.all([
    prisma.project.count(),
    prisma.customer.count(),
    prisma.project.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.quotation.findMany({ select: { status: true, items: true, discount: true, vatEnabled: true } }),
    prisma.expense.findMany({ select: { amount: true } }),
  ])

  const inProgress = projects.filter(p => !['completed', 'lead'].includes(p.status)).length
  const totalRevenue = projects.reduce((s, p) => s + p.value, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const profit = totalRevenue - totalExpenses

  return NextResponse.json({
    projectCount,
    customerCount: customers,
    inProgress,
    totalRevenue,
    totalExpenses,
    profit,
    recentProjects: projects.slice(0, 8),
  })
}
