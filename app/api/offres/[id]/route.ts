import { NextResponse } from 'next/server'
import { jsonError, requireAuth } from '@/lib/server/guard'
import { getOffreDetail } from '@/lib/server/offres'

export const runtime = 'nodejs'

/** GET /api/offres/:id — fiche complète, réservée aux utilisateurs connectés. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { id } = await params
  try {
    const { data, source } = await getOffreDetail(decodeURIComponent(id))
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store', 'X-Data-Source': source } })
  } catch (error) {
    const status = (error as { status?: number }).status
    return status === 404 ? jsonError('Offre introuvable.', 404) : jsonError('Source des offres indisponible.', 502)
  }
}
