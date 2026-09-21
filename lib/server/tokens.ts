import 'server-only'
import { jwtVerify, SignJWT } from 'jose'
import type { Role } from './users'

/**
 * Jetons Bearer : JWT signés HS256 avec AUTH_SECRET.
 * Sans état côté serveur : la déconnexion consiste à oublier le jeton.
 */
export const TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL ?? 8 * 60 * 60)

const secret = (() => {
  const value = process.env.AUTH_SECRET
  if (value && value.length >= 32) return new TextEncoder().encode(value)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET manquant ou trop court (32 caractères minimum).')
  }
  // Développement uniquement : secret stable mais non secret, pour ne pas bloquer.
  return new TextEncoder().encode('dev-only-secret-change-me-in-production!!')
})()

export interface TokenClaims {
  sub: string
  email: string
  role: Role
}

export async function signToken(claims: TokenClaims) {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    if (!payload.sub || typeof payload.email !== 'string') return null
    return { sub: payload.sub, email: payload.email, role: (payload.role as Role) ?? 'user' }
  } catch {
    return null
  }
}
