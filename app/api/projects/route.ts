import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  const body = await req.json()
  // Generate code
  const count = await prisma.project.count()
  const code = `PJ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`
  const project = await prisma.project.create({ data: { ...body, code } })
  return NextResponse.json(project)
}
