import { NextResponse } from 'next/server'
import { bootstrap } from '@/lib/server/bootstrap'
import { jsonError } from '@/lib/server/guard'
import { signToken, TOKEN_TTL_SECONDS } from '@/lib/server/tokens'
import { createUser, findByEmail } from '@/lib/server/users'

export const runtime = 'nodejs'

const ALLOW_REGISTER = process.env.AUTH_ALLOW_REGISTER !== '0'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/auth/register  { email, password, name? }
 * → 201 { access, token_type, expires_in, user }   (connecté d'emblée)
 * → 409 email déjà utilisé · 403 inscriptions fermées (AUTH_ALLOW_REGISTER=0)
 */
export async function POST(request: Request) {
  if (!ALLOW_REGISTER) return jsonError('Les inscriptions sont fermées.', 403)
  await bootstrap()
  let body: { email?: unknown; password?: unknown; name?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonError('Corps JSON attendu.', 400)
  }
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name : undefined
  if (!EMAIL.test(email)) return jsonError('Email invalide.', 400)
  if (password.length < 8) return jsonError('Mot de passe : 8 caractères minimum.', 400)
  if (await findByEmail(email)) return jsonError('Un compte existe déjà avec cet email.', 409)

  const user = await createUser({ email, password, name })
  const access = await signToken({ sub: user.id, email: user.email, role: user.role })
  return NextResponse.json(
    { access, token_type: 'Bearer', expires_in: TOKEN_TTL_SECONDS, user },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
}
