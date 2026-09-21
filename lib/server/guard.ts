import 'server-only'
import { NextResponse } from 'next/server'
import { verifyToken, type TokenClaims } from './tokens'
import { findById, type Role, type User } from './users'

/** Réponse JSON d'erreur homogène. */
export const jsonError = (message: string, status: number) =>
  NextResponse.json({ erreur: message }, { status })

const readBearer = (request: Request) => {
  const header = request.headers.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token.trim() : null
}

export type Guard = { ok: true; user: User; claims: TokenClaims } | { ok: false; response: NextResponse }

/**
 * Exige un Bearer valide, et éventuellement un rôle. Le jeton est relu en
 * base pour qu'un compte supprimé ne conserve pas d'accès jusqu'à expiration.
 */
export async function requireAuth(request: Request, roles?: Role[]): Promise<Guard> {
  const token = readBearer(request)
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { erreur: 'Authentification requise.' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="appelpro"' } },
      ),
    }
  }
  const claims = await verifyToken(token)
  if (!claims) return { ok: false, response: jsonError('Jeton invalide ou expiré.', 401) }
  const user = await findById(claims.sub)
  if (!user) return { ok: false, response: jsonError('Compte introuvable.', 401) }
  if (roles && !roles.includes(user.role)) return { ok: false, response: jsonError('Accès refusé.', 403) }
  return { ok: true, user, claims }
}
