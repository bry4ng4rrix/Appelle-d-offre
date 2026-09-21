import { NextResponse } from 'next/server'
import { bootstrap } from '@/lib/server/bootstrap'
import { jsonError } from '@/lib/server/guard'
import { signToken, TOKEN_TTL_SECONDS } from '@/lib/server/tokens'
import { authenticate } from '@/lib/server/users'

export const runtime = 'nodejs'

/**
 * POST /api/auth/login  { email, password }
 * → 200 { access, token_type: "Bearer", expires_in, user }
 * → 401 identifiants incorrects
 */
export async function POST(request: Request) {
  await bootstrap()
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonError('Corps JSON attendu.', 400)
  }
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) return jsonError('Email et mot de passe requis.', 400)

  const user = await authenticate(email, password)
  if (!user) return jsonError('Identifiants incorrects.', 401)

  const access = await signToken({ sub: user.id, email: user.email, role: user.role })
  return NextResponse.json(
    { access, token_type: 'Bearer', expires_in: TOKEN_TTL_SECONDS, user },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
