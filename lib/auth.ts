import { createHash } from 'crypto'

// Cookie that marks a signed-in session.
export const AUTH_COOKIE = 'mewyou_auth'

// The shared studio password. Set AUTH_PASSWORD in the environment (Vercel →
// Project → Settings → Environment Variables). Falls back to a default so the
// app still works before it's configured — change it in production.
export function getAuthPassword(): string {
  return process.env.AUTH_PASSWORD || 'mewyou2026'
}

// Opaque session token stored in the cookie. Derived from a secret so the
// cookie value can be verified without a database. AUTH_SECRET is optional; if
// absent we derive it from the password (changing the password logs everyone out).
export function expectedToken(): string {
  const secret = process.env.AUTH_SECRET || getAuthPassword()
  return createHash('sha256').update(`mewyou-auth::${secret}`).digest('hex')
}

export function isValidToken(token: string | undefined | null): boolean {
  return !!token && token === expectedToken()
}
