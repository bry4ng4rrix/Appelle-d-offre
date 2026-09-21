import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/server/guard'

export const runtime = 'nodejs'

/** GET /api/auth/me — profil de la session (Bearer requis). */
export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  return NextResponse.json(auth.user, { headers: { 'Cache-Control': 'no-store' } })
}
