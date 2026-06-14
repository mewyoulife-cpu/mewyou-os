import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public (pre-auth) endpoint for the login page. Exposes ONLY two aggregate
// numbers — no project, customer, or financial detail.
export async function GET() {
  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  const [projectCount, thisYear] = await Promise.all([
    prisma.project.count(),
    prisma.project.findMany({
      where: { createdAt: { gte: yearStart } },
      select: { value: true },
    }),
  ])

  const salesThisYear = thisYear.reduce((s, p) => s + p.value, 0)

  return NextResponse.json(
    { projectCount, salesThisYear },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
