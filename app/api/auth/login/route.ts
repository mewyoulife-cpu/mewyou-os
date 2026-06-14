import { NextResponse } from 'next/server'
import { AUTH_COOKIE, expectedToken, getAuthPassword } from '@/lib/auth'

export async function POST(req: Request) {
  let password = ''
  let remember = true
  try {
    const body = await req.json()
    password = String(body.password || '')
    remember = body.remember !== false
  } catch {
    return NextResponse.json({ error: 'คำขอไม่ถูกต้อง' }, { status: 400 })
  }

  if (!password || password !== getAuthPassword()) {
    return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12, // 30 days vs 12 hours
  })
  return res
}
