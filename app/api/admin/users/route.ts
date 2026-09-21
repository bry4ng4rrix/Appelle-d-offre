import { NextResponse } from 'next/server'
import { getDb } from '@/lib/server/db'
import { requireAuth } from '@/lib/server/guard'
import type { User } from '@/lib/server/users'

export const runtime = 'nodejs'

/** GET /api/admin/users — liste des comptes, rôle `admin` requis. */
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['admin'])
  if (!auth.ok) return auth.response
  const db = await getDb()
  const users = await db.all<User>(
    'SELECT id, email, name, role, created_at, last_login_at FROM users ORDER BY created_at DESC',
  )
  return NextResponse.json({ users, moteur: db.engine }, { headers: { 'Cache-Control': 'no-store' } })
}
